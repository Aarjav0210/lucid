# Pane — Biosecurity Sequence Risk Screening

Pane is a web-based biosecurity screening tool that takes DNA or protein sequences as input, runs them against NCBI's BLAST databases, cross-references hits with a curated threat catalog, and uses an LLM to produce a human-readable risk assessment.

## How It Works

```
User submits sequence
        │
        ▼
  Input validation
  (format, size, charset)
        │
        ▼
  Detect sequence type
  (nucleotide vs protein)
        │
        ▼
  BLAST search (NCBI)
  ┌─ nucleotide → blastn against nt
  └─ protein    → blastp against nr
        │
        ▼
  Cross-reference hits against
  curated threat catalog
  (select agents, toxins, dual-use genes)
        │
        ▼
  Compute risk signal
  (HIGH / MEDIUM / LOW / INCONCLUSIVE)
        │
        ▼
  LLM interprets results
  and generates assessment
```

### Screening Pipeline

1. **Validation** — The submitted sequence is checked for valid characters (nucleotide or amino acid), size (max 1 KB), and optionally parsed from FASTA format.

2. **Sequence type detection** — The system auto-detects whether the input is a nucleotide sequence (A/C/G/T/N/U only) or a protein sequence (contains amino-acid-only letters like D, E, F, etc.).

3. **BLAST search** — The sequence is submitted to NCBI BLAST via their public API. Nucleotide sequences use `blastn` against the `nt` database; protein sequences use `blastp` against `nr`. The tool polls until results are ready (up to 3 minutes).

4. **Threat catalog matching** — Each BLAST hit is cross-referenced against a curated catalog of ~35 known threat-associated sequences, including:
   - **Select agent virulence genes** — Anthrax (pagA, lef, cya), plague (pla, caf1, lcrV), Ebola (GP, VP24, VP35), tularemia (iglC), smallpox (CrmB)
   - **Regulated toxins** — Ricin, abrin, botulinum neurotoxins (A–F), staphylococcal enterotoxins, C. perfringens epsilon toxin
   - **Dual-use genes** — Antibiotic resistance (TEM-1, SHV-1, CTX-M-15, KPC-2, NDM-1, VIM-1, OXA-48, MCR-1, VanA/B, mecA)
   - **Gain-of-function markers** — Influenza PB2, H5N1 hemagglutinin

5. **Risk classification** — Hits are classified into match tiers based on identity, coverage, and e-value:

   | Tier     | Identity | Coverage | Meaning                        |
   |----------|----------|----------|--------------------------------|
   | exact    | ≥95%     | ≥90%     | Essentially identical          |
   | high     | ≥80%     | ≥70%     | Likely variant or close homolog|
   | moderate | ≥60%     | ≥50%     | Distant homolog                |
   | low      | <60%     | <50%     | No confident match             |

   Risk signal is computed from the combination of match tier and threat category.

6. **LLM interpretation** — The BLAST results are passed to a Gemini model (via the Vercel AI SDK), which generates a structured risk assessment including risk level, confidence score, summary, reasoning, and specific flags.

## Setup

### Prerequisites

- Node.js 18+
- A Google AI API key (for Gemini)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Paste a nucleotide or protein sequence into the text area (plain text or FASTA format, max 1 KB).
2. Or click one of the example sequence buttons (GFP, Ricin A-chain, Beta-lactamase, Unknown Fragment).
3. Click **Screen Sequence**.
4. Wait for the BLAST search to complete (30s–3min).
5. Review the BLAST results card (expandable hit details) and the LLM-generated risk assessment.

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **Vercel AI SDK** (`ai` + `@ai-sdk/google`) — tool-calling with streaming
- **Tailwind CSS 4**
- **Zod** — schema validation
- **NCBI BLAST REST API** — sequence alignment
- **Gemini 2.0 Flash Lite** — LLM for risk interpretation

## Project Structure

```
src/
├── app/
│   ├── api/assess/route.ts   # POST endpoint: validates input, streams LLM + BLAST
│   ├── page.tsx               # Main UI: sequence input, BLAST results, assessment display
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Tailwind styles
└── lib/
    ├── blast.ts               # NCBI BLAST submission, polling, result parsing, risk computation
    ├── model.ts               # LLM model configuration (Gemini 2.0 Flash Lite)
    ├── prompt.ts              # System prompt for the screening assistant
    ├── schema.ts              # Zod schemas for risk assessment output
    ├── validate.ts            # Sequence validation and type detection
    ├── threat-catalog.ts      # Curated catalog of threat-associated sequences
    ├── examples.ts            # Example sequences for the UI
    └── tools/
        └── blast-tool.ts      # Vercel AI SDK tool wrapper for BLAST
```
