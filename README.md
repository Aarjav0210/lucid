# Lucid

**Automated biosecurity screening for the protein synthesis industry.**

---

## The Problem

The commercial protein synthesis industry is facing a new era of regulatory scrutiny. The 2024 Executive Order on Safe, Secure, and Trustworthy AI directed federal agencies to establish standards for nucleic acid synthesis screening — and the practical burden of compliance falls on synthesis providers who must verify that every incoming order is safe before it ships.

Today, most providers rely on BLAST-based sequence homology screening: compare the order against a database of known threats and flag anything that looks too similar. This worked when the threat landscape was limited to naturally occurring pathogens. It no longer does.

Modern AI protein design tools — ProteinMPNN, RFdiffusion, EvoDiff — can generate sequences that preserve the three-dimensional fold and biological function of a dangerous protein while reducing sequence identity far below BLAST detection thresholds. A redesigned toxin catalytic domain at 25% sequence identity passes BLAST without a second glance, but it folds into the same lethal structure.

Worse, chimeric sequences can split a dangerous function across individually benign domains. A cell-binding lectin domain fused to a ribosome-inactivating enzyme domain produces a functional toxin delivery system — but each domain in isolation is unremarkable. Full-sequence BLAST dilutes the signal from any single dangerous component because the benign domains dominate the alignment score. This is the split attack problem, and existing screening pipelines are blind to it.

## How Lucid Works

Lucid is a multi-stage screening pipeline that catches what BLAST alone cannot. Instead of treating a sequence as a monolithic string to match, Lucid decomposes it into its functional parts and analyzes each one independently — then reasons about what they mean when combined.

**Stage 1 — Domain Decomposition (InterPro)**
Every incoming sequence is submitted to InterPro for domain annotation. InterPro identifies the structural and functional boundaries within the protein — the individual building blocks that determine what the protein actually does. If no recognizable domains are found, the pipeline reports that and stops. If domains are detected, each one is extracted as a separate screening target.

This is the critical defense against split attacks. By isolating each domain, Lucid prevents benign regions from masking dangerous ones. A chimeric protein with one safe domain and one threat domain will have the threat domain flagged individually, regardless of how the full-sequence alignment looks.

**Stage 2 — Per-Domain Threat Screening (Diamond + ESMFold + Foldseek)**
Each extracted domain runs through a parallel screening pipeline:

- **Diamond** performs fast sequence alignment against a curated database of known threat sequences — select agents, regulated toxins, and dual-use enzymes. If Diamond finds a strong match, the domain is immediately flagged and the pipeline skips directly to reporting. No need to predict structure for something that's already a near-identical copy of a known threat.

- **ESMFold** predicts the three-dimensional structure of the domain from sequence alone. This takes seconds, not hours, and produces a PDB file with per-residue confidence scores.

- **Foldseek** searches the predicted structure against the Protein Data Bank and AlphaFold Database. This is where redesigned sequences get caught — a toxin domain that's been mutated below BLAST detection will still fold into a recognizable toxin structure. Foldseek flags it based on structural similarity, not sequence identity.

At each stage, hits are checked against a curated set of dangerous keywords — toxin, virulence, host-virus interaction, ribosome-inactivating protein — and flagged accordingly.

**Stage 3 — Integrated Risk Assessment (Gemini)**
After all domains have been individually screened, an LLM synthesizes the results into a comprehensive risk report. This is not pattern matching — it's functional reasoning. The model evaluates whether the specific combination of domains in the sequence constitutes a plausible threat. A lectin domain alone is harmless. A ribosome-inactivating enzyme alone has limited toxicity. Together, they form the architecture of ricin, one of the most regulated biological toxins in existence.

The integrated report identifies synergistic risk factors, assigns an overall risk level (LOW / MEDIUM / HIGH), and generates a detailed reasoning chain explaining why. Every output uses opaque sample identifiers — the system never reveals the actual identity of a matched protein, even internally.

## Plug-and-Play Compliance

Lucid is built as a self-contained web application that synthesis screening providers can deploy directly. There is no machine learning model to train, no database to curate from scratch, no bioinformatics pipeline to assemble. Submit a sequence, get a report.

- **Web UI** with sequence input, real-time pipeline progress, and a comprehensive visual report
- **Streaming API** (SSE) for integration into existing order management systems
- **Domain architecture visualization** showing each domain as a labeled region with position and risk level
- **Per-domain analysis cards** displaying Diamond, ESMFold, and Foldseek results for full auditability
- **Integrated risk assessment** with synergistic factor analysis and LLM-generated reasoning

The entire pipeline runs against public APIs (InterPro, ESMFold, Foldseek) and a local Diamond database. The only required credential is a Google AI API key for the Gemini-powered report synthesis, with a static fallback if unavailable.

## Architecture

```
Submitted Sequence
        |
        v
  [Validation]  ───  400 AA limit, protein detection
        |
        v
  [InterPro]  ───  Domain annotation (EBI API)
        |
   No domains? ── Truncate pipeline, report UNKNOWN
        |
        v
  [Domain Extraction]  ───  Non-overlapping structural domains
        |
        v
  [Per-Domain Pipelines]  ───  Parallel branches
        |
   ┌────┴────┐
   v         v
 Domain 1  Domain 2  ...
   |         |
   v         v
 Diamond ── Strong match? ── Skip to report
   |                            |
   v                            |
 ESMFold                        |
   |                            |
   v                            |
 Foldseek                       |
   |                            |
   └────────────┬───────────────┘
                v
  [Integrated Report]  ───  Gemini synthesis
                |
                v
        Risk Assessment
     LOW / MEDIUM / HIGH
```

## Running

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add your GOOGLE_GENERATIVE_AI_API_KEY

# Start development server
npm run dev

# Run integration test
npm run test:integration

# Run integration test with Gemini report
npm run test:integration:gemini
```

## External Services

| Service | Purpose | Auth |
|---------|---------|------|
| InterPro (EBI) | Domain annotation | Email param |
| ESMFold (Meta) | Structure prediction | None |
| Foldseek | Structural similarity search | None |
| Diamond | Local sequence alignment | None (local binary) |
| Gemini (Google) | Integrated report synthesis | API key |

## Key Design Decisions

**Why decompose into domains?** Full-sequence screening lets benign domains mask dangerous ones. Per-domain screening isolates each functional unit, catching chimeric threats that BLAST misses entirely.

**Why structure-based screening?** AI-designed sequences can have <30% identity to known threats while preserving the dangerous fold. Foldseek catches what sequence alignment cannot.

**Why an LLM for the final report?** Rule-based classifiers can flag individual signals, but they cannot reason about whether a specific combination of domains constitutes a functional threat. The LLM layer provides the biological reasoning that connects "lectin domain + RIP domain" to "functional holotoxin."

**Why ESMFold over AlphaFold2?** ESMFold runs in seconds. For a screening tool processing orders in real time, the 60x speed advantage matters more than marginal accuracy gains.

**Why mask protein identities?** The system treats every submission as an order from a customer. Even when a domain matches a known threat with high confidence, the output uses opaque identifiers. The report communicates risk level and reasoning without serving as a recipe.
