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

## Database Setup (PandemicPulse)

The outbreak tracking pipeline (Pulse) requires a PostgreSQL database with PostGIS. The database itself is **not** checked into git — these steps recreate it from scratch.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts a `postgis/postgis:16-3.4` container with:
- **User:** `pandemic` / **Password:** `pandemic`
- **Database:** `pandemic_pulse`
- **Port:** `5432`

Data is persisted in a Docker volume (`pgdata`). To wipe and start fresh:

```bash
docker compose down -v   # removes volume
docker compose up -d
```

### 2. Configure environment

Copy the example env file if you haven't already:

```bash
cp .env.local.example .env.local
```

**Prisma CLI** (`db:deploy`, `db:migrate`, `db:push`, `db:studio`) loads variables from **`.env.local`** via `dotenv-cli`. Next.js also reads `.env.local`; a root **`.env`** alone is not used by those npm scripts.

Set `DATABASE_URL` and `DIRECT_URL` (for local Docker, use the same connection string for both):

```
DATABASE_URL="postgresql://pandemic:pandemic@localhost:5432/pandemic_pulse?schema=public"
DIRECT_URL="postgresql://pandemic:pandemic@localhost:5432/pandemic_pulse?schema=public"
```

### 3. Apply the schema (migrations)

Migrations live in `prisma/migrations`. Apply them to a fresh database:

```bash
npm run db:deploy
```

For day-to-day schema iteration you can still use `npm run db:push`, then create a migration with `npm run db:migrate` when you are ready to commit schema changes.

If you **already** created tables earlier with `db:push` only, mark the initial migration as applied so Prisma stays in sync:

```bash
npx prisma migrate resolve --applied 20250405120000_init
```

Generate the Prisma client (usually automatic, but run if you see import errors):

```bash
npm run db:generate
```

### 4. Seed outbreak data

Run every adapter once to populate the database from all sources (WHO DON, disease.sh, CDC Socrata, Delphi Epidata, Global.health):

```bash
npm run pipeline:seed
```

Run **only** selected sources (comma-separated Prisma `source` ids — same as `npm run test:adapters -- --only=…`):

```bash
npm run pipeline:seed -- --only=cdc_socrata,delphi_epidata,global_health
```

This fetches live data from each source and inserts it. Expect **much longer** on a remote DB (WHO + disease.sh + CDC is a large volume of upserts). **Re-running is safe**: WHO/CDC/Global.health/Delphi use idempotent upserts; disease.sh uses `skipDuplicates` batch inserts.

If the run stops with Prisma **P1017** (“server has closed the connection”), that is usually **sleep, Wi‑Fi, or a pooler dropping a multi‑hour session**. Re-run the same command when you are back online; progress already written stays in the DB.

For **Supabase**, prefer seeding over a **session/direct (port 5432)** URL so the pooler does not kill a long job:

```bash
npm run pipeline:seed:direct
```

(`USE_DIRECT_URL_FOR_PIPELINE=1` makes Prisma use `DIRECT_URL` for CLI access only; the Next.js app still uses `DATABASE_URL` from `.env.local`.)

### 5. Run the status lifecycle

Age events through the status pipeline (`active` → `monitoring` → `contained` → `resolved`) based on how stale their `lastReportDate` is:

```bash
npm run test:lifecycle
```

### Supabase and production (Next.js / Vercel)

1. Create a project in [Supabase](https://supabase.com/dashboard), open **Project Settings → Database**.
2. Set **connection strings** in your deployed environment (and in `.env.local` when testing against Supabase):
   - **`DATABASE_URL`**: use the **Transaction pooler** string (`port 6543`, include `?pgbouncer=true` if shown). This is what the Next.js app should use at runtime.
   - **`DIRECT_URL`**: use the **Session mode** pooler on port **5432**, or the **Direct connection** URI (also port 5432). Prisma runs `migrate` against this URL (`prisma migrate deploy` does not work through the transaction pooler).
3. Apply migrations to the remote database (from your machine, with env vars pointing at Supabase):

```bash
npm run db:deploy
```

4. **Copy existing local data** into Supabase (after migrations succeeded). Use a direct/session URL, not the transaction pooler:

```bash
export LOCAL_DATABASE_URL="postgresql://pandemic:pandemic@localhost:5432/pandemic_pulse?schema=public"
export SUPABASE_DIRECT_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
REPLACE=1 bash scripts/copy-local-db-to-supabase.sh
```

`REPLACE=1` truncates the three Pulse tables on Supabase before loading so you do not duplicate rows.

5. **Vercel**: add `DATABASE_URL`, `DIRECT_URL`, and your other secrets to the project. The default `npm run build` runs `scripts/vercel-build.sh`, which runs `prisma generate` and `prisma migrate deploy` when both URLs are set, then `next build`.

### Quick reference

| Command | Description |
|---|---|
| `docker compose up -d` | Start PostgreSQL |
| `docker compose down -v` | Destroy database and volume |
| `npm run db:deploy` | Apply Prisma migrations (local or Supabase) |
| `npm run db:push` | Quick schema sync without a migration (dev only) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run pipeline:seed` | Fetch and insert data from all sources |
| `npm run pipeline:seed -- --only=a,b` | Same, but only listed `source` ids (e.g. `cdc_socrata`) |
| `npm run pipeline:seed:direct` | Same as seed, but uses `DIRECT_URL` (better for long Supabase runs) |
| `npm run test:lifecycle` | Run status lifecycle transitions |
| `npm run pipeline:status` | Check pipeline poll logs |
| `npm run pipeline` | Start the scheduled pipeline (cron) |

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
