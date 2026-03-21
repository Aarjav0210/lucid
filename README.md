# BioScreen — Biosecurity Screening Pipeline

An agentic biosecurity tool that screens protein/DNA sequences for potential dual-use risk. It combines sequence homology, structure-based screening, and LLM-driven reasoning to catch threats that evade traditional BLAST-only approaches — including AI-redesigned chimeric sequences.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Pipeline Stages](#pipeline-stages)
  - [Stage 0 — Intake](#stage-0--intake)
  - [Stage 1 — Domain Annotation](#stage-1--domain-annotation)
  - [Stage 2 — Structural Screening](#stage-2--structural-screening)
  - [Stage 3 — Agent Risk Reasoning](#stage-3--agent-risk-reasoning)
  - [Stage 4 — Output](#stage-4--output)
- [Key Design Decisions](#key-design-decisions)
- [External APIs](#external-apis)
- [Data Flow](#data-flow)
- [File Structure](#file-structure)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Threat Model](#threat-model)
- [Known Limitations](#known-limitations)

---

## Architecture Overview

```
Submitted Sequence
        │
        ▼
┌─────────────────────────────────────────────────────┐
│  INTAKE                                             │
│  Validate sequence (AA or nucleotide), normalise   │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│  DOMAIN ANNOTATION  (InterProScan / Pfam)           │
│  Identify domain boundaries, family hits, GO terms  │
└──────────────────────────┬──────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │ multi-domain?           │ single-domain
              ▼                         ▼
┌─────────────────────┐    ┌───────────────────────────┐
│  PER-DOMAIN SCREEN  │    │  FULL-SEQUENCE SCREEN      │
│  Slice by boundary  │    │  BLAST + Foldseek          │
│  ESMFold + Foldseek │    │  (no decomposition needed) │
└──────────┬──────────┘    └──────────────┬─────────────┘
           └──────────────┬───────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  AGENT RISK REASONING  (LLM)                        │
│  Domain combination analysis, function inference,   │
│  linker anomaly detection, structural hit scoring   │
└──────────────────────────┬──────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
        LOW risk       MEDIUM risk     HIGH risk
           │               │               │
        Approved      Manual Review    Blocked +
           │               │           Audit Request
           └───────────────┴───────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│  RISK REPORT                                        │
│  Summary + Domains of Concern + Reasoning Trace     │
│  + pLDDT confidence map + Audit Log                 │
└─────────────────────────────────────────────────────┘
```

---

## Pipeline Stages

### Stage 0 — Intake

**Entry point:** `app/intake.py`

Accepts a raw sequence string (amino acid or nucleotide). Performs:

- Format detection (protein vs DNA/RNA)
- Character validation against IUPAC alphabets
- Length gating (reject sequences < 10aa or > 2000aa with a warning)
- Nucleotide → protein translation if needed (via Biopython `Seq.translate`)
- Deduplication check against a local Redis cache keyed on sequence hash

```python
# Expected input
{
  "sequence": "MKTAYIAKQRQISFVKSHFSRQ...",
  "submitter_id": "user_abc123",       # for audit log
  "stated_purpose": "drug discovery"   # optional, passed to agent context
}

# Output to Stage 1
{
  "sequence": str,          # cleaned, uppercase AA sequence
  "seq_hash": str,          # SHA256 of normalised sequence
  "length": int,
  "source_type": "protein" | "nucleotide"
}
```

---

### Stage 1 — Domain Annotation

**Entry point:** `app/interpro.py`

Submits sequence to the **InterProScan REST API** (EBI Job Dispatcher) and parses the response. This stage is asynchronous — job is submitted, polled every 5 seconds, result retrieved.

**API used:** `https://www.ebi.ac.uk/Tools/services/rest/iprscan5/`

Key parameters:
- `appl=Pfam,TIGRFAM,SUPERFAMILY,SMART` — run multiple member databases
- `goterms=true` — fetch GO term annotations
- `pathways=true` — fetch pathway annotations

**Output schema:**

```python
{
  "domains": [
    {
      "pfam_id": "PF00001",
      "name": "7tm_1",
      "start": 12,
      "end": 289,
      "evalue": 1e-42,
      "go_terms": ["GO:0004930", "GO:0007186"],
      "organism_distribution": ["Eukaryota"],
      "is_novel": False       # True if no Pfam hit, only raw coordinates
    }
  ],
  "coverage": 0.87,           # fraction of sequence covered by domain hits
  "is_multidomain": True,
  "linker_regions": [         # gaps between domain boundaries
    {"start": 290, "end": 340, "length": 50}
  ],
  "cross_kingdom": False      # True if domains span very different clades
}
```

**Escalation signals (passed to agent):**
- `coverage < 0.5` — large unexplained regions
- `cross_kingdom = True` — unusual domain mixing
- Any domain with `is_novel = True`
- Linker regions with `length < 15` (engineered-linker heuristic)

---

### Stage 2 — Structural Screening

**Entry point:** `app/structural.py`

Branched based on domain annotation output.

#### 2A — Full-Sequence Screen (single-domain path)

Run when `is_multidomain = False`.

1. **ESMFold** — predict 3D structure from sequence
2. **Foldseek** — search predicted structure against PDB + AlphaFold DB
3. **pLDDT extraction** — parse per-residue confidence from PDB B-factor column

**ESMFold API:**
```
POST https://api.esmatlas.com/foldSequence/v1/pdb/
Content-Type: application/x-www-form-urlencoded
Body: <raw AA sequence>
Returns: PDB format string
```

**Foldseek API:**
```
POST https://search.foldseek.com/api/ticket
  files: q = <PDB file>
  data:  database[] = pdb100, afdb50
         mode = 3diaa
Returns: { ticket: str }

GET https://search.foldseek.com/api/ticket/{ticket}   # poll status
GET https://search.foldseek.com/api/result/{ticket}/0 # fetch results
```

**Output schema:**

```python
{
  "pdb_string": str,
  "plddt_mean": float,
  "plddt_per_residue": list[float],
  "disordered_regions": [{"start": int, "end": int}],
  "structural_hits": [
    {
      "target_name": str,      # PDB ID or AlphaFold accession
      "tm_score": float,       # > 0.5 = similar fold, > 0.7 = strong homology
      "evalue": float,
      "description": str
    }
  ]
}
```

**Risk thresholds (passed to agent):**
- `tm_score > 0.7` against any known toxin/pathogen structure → HIGH flag
- `tm_score 0.5–0.7` → MEDIUM flag, include in agent context
- `plddt_mean < 60` → low confidence, deprioritise structural hits

#### 2B — Per-Domain Screen (multi-domain path)

Run when `is_multidomain = True`.

For each domain from Stage 1:
1. Slice sequence by `[domain.start : domain.end]`
2. Run full Stage 2A pipeline on the slice
3. Collect per-domain structural hits

Additionally:
- Cross-reference linker regions with pLDDT — low confidence at inter-domain boundaries correlates with engineered linkers
- Flag if any domain slice hits a known dangerous structure even when full-sequence BLAST would miss it (the primary AI-evasion detection case)

**Output schema:** list of `Stage2A` results, one per domain, plus:

```python
{
  "per_domain_results": [...],   # list of 2A outputs
  "linker_plddt_flags": [        # linker regions with low pLDDT
    {"region": {"start": int, "end": int}, "mean_plddt": float}
  ],
  "any_domain_high_risk": bool
}
```

---

### Stage 3 — Agent Risk Reasoning

**Entry point:** `app/agent.py`

An LLM agent (Claude via Anthropic API) receives all upstream signals and reasons over them using a biosecurity-focused system prompt. This is not a rule-based classifier — it is intended to catch emergent combination risks that no individual signal would surface.

**System prompt role:** biosecurity expert with knowledge of known toxin mechanisms, binary toxin systems (e.g. anthrax PA/LF), chimeric protein engineering patterns, and dual-use research of concern (DURC) frameworks.

**Agent input context:**

```python
{
  "sequence_metadata": { "length": int, "coverage": float, ... },
  "domain_annotation": { ... },         # Stage 1 output
  "structural_results": { ... },        # Stage 2 output (2A or 2B)
  "submitter_context": {
    "stated_purpose": str,
    "submitter_id": str
  }
}
```

**Agent reasoning tasks:**
1. Evaluate each domain's functional role independently
2. Assess whether the domain combination constitutes a plausible dangerous assembly (e.g. binding + translocation + catalytic)
3. Score linker anomalies in context of domain adjacency
4. Cross-check structural hits against known dangerous protein families
5. Assign risk level: `LOW | MEDIUM | HIGH`
6. Generate human-readable summary with explicit reasoning chain

**Output schema:**

```python
{
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "risk_score": float,           # 0.0–1.0
  "domains_of_concern": [
    {
      "domain_name": str,
      "reason": str,
      "structural_hit": str,     # PDB ID if applicable
      "tm_score": float
    }
  ],
  "combination_risk": bool,      # True if risk arises from domain combo
  "combination_explanation": str,
  "reasoning_trace": str,        # full chain-of-thought from LLM
  "recommended_action": "APPROVE" | "MANUAL_REVIEW" | "BLOCK"
}
```

---

### Stage 4 — Output

**Entry point:** `app/report.py`

Assembles final risk report from all stages. Written to the audit log and returned to the caller.

**Report fields:**

```python
{
  "report_id": str,              # UUID
  "timestamp": str,              # ISO 8601
  "seq_hash": str,
  "submitter_id": str,
  "risk_level": str,
  "risk_score": float,
  "summary": str,                # 2–3 sentence human-readable summary
  "domains_of_concern": [...],
  "reasoning_trace": str,
  "structural_hits": [...],
  "plddt_map": list[float],
  "recommended_action": str,
  "audit_flag": bool,            # True if BLOCK or MANUAL_REVIEW
  "audit_reason": str
}
```

Audit-flagged reports are written to `audit_log.jsonl` and optionally POSTed to a webhook.

---

## Key Design Decisions

### Why structure-based screening, not just BLAST?

Current IGSC-standard screening is sequence-homology-based. AI protein design tools (ProteinMPNN, EvoDiff) can generate sequences with <40% identity to known dangerous proteins while preserving the dangerous fold. BLAST misses these. Foldseek operates in structural space (TM-score), not sequence space, catching redesigned sequences.

### Why domain decomposition for multi-domain sequences?

A chimeric protein assembled from individually benign domains can be dangerous through combination (e.g. a cell-binding domain + a sequence-redesigned toxin catalytic domain). Full-sequence BLAST dilutes the signal from the dangerous domain because the benign domains dominate the alignment. Per-domain screening isolates the signal.

### Why an LLM agent, not a rule-based classifier?

Rule-based classifiers operate on known threat signatures. Novel chimeric assemblies — particularly those using AI-designed domains with no sequence precedent — fall outside any fixed rule set. The agent layer provides semantic reasoning over functional biology: "does this combination of parts add up to something dangerous?" This requires understanding biological function, not just pattern matching.

### Why ESMFold over AlphaFold2/ColabFold?

ESMFold is ~60x faster than AlphaFold2 (seconds vs minutes per sequence) with only modest accuracy tradeoff. For a real-time screening tool where sequences arrive continuously, ESMFold's latency profile is correct. The accuracy tradeoff is acceptable because Foldseek operates on TM-score thresholds that are robust to minor structural inaccuracies.

---

## External APIs

| API | Purpose | Auth | Docs |
|-----|---------|------|------|
| ESM Metagenomic Atlas | Structure prediction | None | https://api.esmatlas.com |
| Foldseek Web Server | Structural search | None | https://search.foldseek.com |
| InterProScan (EBI) | Domain annotation | Email param | https://www.ebi.ac.uk/Tools/services/rest/iprscan5 |
| NCBI BLAST (optional) | Sequence homology | None (rate limited) | https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi |
| Anthropic API | Agent reasoning | `ANTHROPIC_API_KEY` | https://docs.anthropic.com |

All external API calls include retry logic with exponential backoff (`app/utils/retry.py`). Results are cached by sequence hash in Redis to avoid redundant calls during demo.

---

## Data Flow

```
intake.py
  └─► interpro.py          (async, ~30–60s)
        └─► structural.py
              ├─► [single] esm_fold() + foldseek_search()    (~30–40s)
              └─► [multi]  for each domain:
                             esm_fold(slice) + foldseek_search()
                           + linker_plddt_analysis()
        └─► agent.py       (LLM call, ~5–10s)
              └─► report.py
                    └─► audit_log.jsonl
                    └─► API response to caller
```

Total wall time (single-domain, no cache): ~60–90 seconds.
Total wall time (multi-domain, 3 domains): ~90–150 seconds.
With Redis cache hit: < 1 second.

---

## File Structure

```
bioscreen/
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── intake.py            # Stage 0: sequence validation
│   ├── interpro.py          # Stage 1: domain annotation
│   ├── structural.py        # Stage 2: ESMFold + Foldseek
│   ├── agent.py             # Stage 3: LLM risk reasoning
│   ├── report.py            # Stage 4: report assembly + audit log
│   └── utils/
│       ├── retry.py         # Exponential backoff for external APIs
│       ├── cache.py         # Redis cache wrapper
│       └── pdb_utils.py     # PDB parsing, pLDDT extraction
├── prompts/
│   └── biosecurity_agent.txt  # System prompt for agent
├── tests/
│   ├── test_intake.py
│   ├── test_interpro.py
│   ├── test_structural.py
│   └── fixtures/
│       ├── safe_sequence.fasta
│       ├── chimeric_demo.fasta    # Demo: passes BLAST, fails structure screen
│       └── known_toxin.fasta
├── audit_log.jsonl          # Append-only audit trail
├── docker-compose.yml       # App + Redis
├── requirements.txt
└── README.md
```

---

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...       # Required: agent reasoning
HF_TOKEN=hf_...                    # Optional: HuggingFace ESMFold fallback
REDIS_URL=redis://localhost:6379   # Optional: caching (default: in-memory)
AUDIT_WEBHOOK_URL=https://...      # Optional: POST audit flags to external system
ESM_API_URL=https://api.esmatlas.com/foldSequence/v1/pdb/
FOLDSEEK_API_URL=https://search.foldseek.com/api
INTERPRO_API_URL=https://www.ebi.ac.uk/Tools/services/rest/iprscan5
INTERPRO_EMAIL=you@example.com    # Required by EBI job dispatcher
```

---

## Running the App

```bash
# Install dependencies
pip install -r requirements.txt

# Start Redis (or use in-memory cache without it)
docker-compose up -d redis

# Run the API server
uvicorn app.main:app --reload --port 8000

# Submit a sequence
curl -X POST http://localhost:8000/screen \
  -H "Content-Type: application/json" \
  -d '{
    "sequence": "MKTAYIAKQRQISFVKSHFSRQ...",
    "submitter_id": "demo_user",
    "stated_purpose": "academic research"
  }'
```

---

## Threat Model

This tool is designed to catch the following adversarial patterns:

**Pattern 1 — Sequence-redesigned dangerous protein**
A known toxin run through ProteinMPNN/EvoDiff to reduce sequence identity below BLAST detection threshold. Caught by: structural screening (Foldseek TM-score).

**Pattern 2 — Chimeric assembly of innocuous parts**
Individually benign domains combined into a dangerous functional unit (e.g. binding domain + sequence-redesigned catalytic toxin domain). Caught by: per-domain structural screening + agent combination reasoning.

**Pattern 3 — Binary toxin split across submissions**
Two separately submitted sequences that are individually non-toxic but dangerous in combination (e.g. anthrax PA + LF analogs). Partially caught by: agent reasoning over domain functional roles. Note: cross-submission correlation is not currently implemented.

**Pattern 4 — Novel fold with dangerous function**
A de novo designed protein with no structural precedent that nonetheless performs a dangerous function. Not reliably caught by current implementation — this is the open research problem.

---

## Known Limitations

- **No cross-submission correlation** — binary toxin pairs submitted separately will not be flagged at the individual sequence level.
- **Novel fold blindspot** — sequences with no structural homology to known proteins (TM-score < 0.4 against all PDB entries) produce no structural signal. The agent will flag low-confidence outputs but cannot confirm danger.
- **ESMFold accuracy** — ESMFold is less accurate than AlphaFold2 on sequences with little evolutionary data. This may produce false negatives on rare organism proteins.
- **LLM reasoning is not deterministic** — agent outputs may vary slightly between runs. Risk scores should be treated as probabilistic signals, not ground truth.
- **InterProScan latency** — the EBI API can take 60–120 seconds under load. This is the dominant latency bottleneck and may be unacceptable for high-throughput deployments. Local HMMER installation recommended for production.
- **Select agent database** — no curated dangerous-protein database is included. Foldseek searches against all of PDB, relying on the agent to identify which structural hits are biosecurity-relevant. A focused dangerous-structure database would improve precision.