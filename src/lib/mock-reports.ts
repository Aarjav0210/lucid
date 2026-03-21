/* ─── Types ─── */

export interface DiamondResult {
  topHit: string;
  organism: string;
  identity: number;
  evalue: number;
  coveragePercent: number;
  threatMatch: boolean;
  details: string;
}

export interface EsmfoldResult {
  pLDDT: number;
  structuralNotes: string;
}

export interface FoldseekResult {
  topHit: string;
  pdbId: string | null;
  tmScore: number;
  organism: string;
  threatMatch: boolean;
  details: string;
}

export interface DomainAnalysis {
  domainId: string;
  domainName: string;
  interproId: string;
  range: string;
  diamond: DiamondResult;
  esmfold: EsmfoldResult;
  foldseek: FoldseekResult;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskSummary: string;
}

export interface UnifiedReport {
  overallRisk: "PASS" | "FLAG" | "REJECT";
  confidence: number;
  summary: string;
  synergisticEffects: string | null;
  recommendation: string;
  flags: string[];
}

export interface SequenceReport {
  orderId: string;
  description: string;
  sequenceLength: number;
  sequenceType: "protein";
  domainCount: number;
  domains: DomainAnalysis[];
  unified: UnifiedReport;
}

/* ─── Mock Data ─── */

/**
 * Example 1: ORD-2024-0847
 * 4 domains, none individually pathogenic. Synergistic effects flag for human review.
 * A chimeric construct combining cell penetration, RNA binding, furin-like
 * protease activity, and viral fusion — individually benign/dual-use but
 * together a realistic concern.
 */
const report1: SequenceReport = {
  orderId: "ORD-2024-0847",
  description: "Customer synthesis order — protein sequence, 398 aa",
  sequenceLength: 398,
  sequenceType: "protein",
  domainCount: 4,
  domains: [
    {
      domainId: "D1",
      domainName: "Cell-penetrating peptide domain",
      interproId: "IPR001752",
      range: "1–47",
      diamond: {
        topHit: "Tat protein [Human immunodeficiency virus 1]",
        organism: "HIV-1",
        identity: 72.3,
        evalue: 3.1e-8,
        coveragePercent: 89,
        threatMatch: false,
        details:
          "Matches the cell-penetrating peptide region of HIV-1 Tat. CPPs are widely used in drug delivery and cell biology research. No direct toxin or virulence association for this domain alone.",
      },
      esmfold: {
        pLDDT: 89.2,
        structuralNotes:
          "High-confidence alpha-helical structure with characteristic arginine-rich motif. Consistent with known CPP folds.",
      },
      foldseek: {
        topHit: "Cell-penetrating peptide, Tat-derived",
        pdbId: "2M3I",
        tmScore: 0.82,
        organism: "Synthetic construct",
        threatMatch: false,
        details:
          "Structural match to engineered cell-penetrating peptides used in therapeutic delivery. No structural similarity to known toxins.",
      },
      riskLevel: "LOW",
      riskSummary:
        "Cell-penetrating peptides are standard tools in molecular biology and drug delivery. No direct threat association.",
    },
    {
      domainId: "D2",
      domainName: "dsRNA-binding domain",
      interproId: "IPR014720",
      range: "48–156",
      diamond: {
        topHit: "Double-stranded RNA-specific adenosine deaminase [Homo sapiens]",
        organism: "Homo sapiens",
        identity: 68.1,
        evalue: 2.7e-19,
        coveragePercent: 94,
        threatMatch: false,
        details:
          "Matches the dsRBD of human ADAR1. This is a ubiquitous RNA-binding motif found across all domains of life. No virulence function.",
      },
      esmfold: {
        pLDDT: 92.4,
        structuralNotes:
          "Well-folded canonical αβββα topology. Clear dsRNA-binding surface with conserved interaction residues.",
      },
      foldseek: {
        topHit: "dsRNA-binding domain, ADAR family",
        pdbId: "1DI2",
        tmScore: 0.91,
        organism: "Homo sapiens",
        threatMatch: false,
        details:
          "High structural similarity to canonical dsRBD fold found in RNA editing enzymes, PKR, and Dicer. Widespread in normal cellular processes.",
      },
      riskLevel: "LOW",
      riskSummary:
        "Common RNA-binding motif present in hundreds of human proteins. No independent threat association.",
    },
    {
      domainId: "D3",
      domainName: "Subtilisin-like serine protease",
      interproId: "IPR000209",
      range: "157–312",
      diamond: {
        topHit: "Furin, paired basic amino acid cleaving enzyme [Homo sapiens]",
        organism: "Homo sapiens",
        identity: 61.4,
        evalue: 8.5e-34,
        coveragePercent: 87,
        threatMatch: false,
        details:
          "Matches the catalytic domain of human furin proprotein convertase. Furin-like proteases are dual-use: essential in normal protein processing but also exploited by pathogens for toxin activation (e.g., anthrax, diphtheria, Ebola GP cleavage).",
      },
      esmfold: {
        pLDDT: 87.1,
        structuralNotes:
          "Confident fold prediction showing intact catalytic triad (Asp-His-Ser). Active site geometry consistent with functional protease.",
      },
      foldseek: {
        topHit: "Subtilase superfamily, proprotein convertase",
        pdbId: "5JXH",
        tmScore: 0.78,
        organism: "Homo sapiens",
        threatMatch: false,
        details:
          "Structural match to subtilase superfamily. The furin-like substrate specificity pocket is preserved, suggesting capacity for R-X-K/R-R cleavage motif recognition.",
      },
      riskLevel: "MEDIUM",
      riskSummary:
        "Dual-use concern: furin-like proteases are required for activation of multiple pathogenic toxins and viral fusion proteins. Functional protease activity confirmed by structural analysis.",
    },
    {
      domainId: "D4",
      domainName: "Class I viral fusion peptide",
      interproId: "IPR000665",
      range: "313–398",
      diamond: {
        topHit: "Fusion glycoprotein F0 [Human parainfluenza virus 3]",
        organism: "Human parainfluenza virus 3",
        identity: 58.2,
        evalue: 4.2e-14,
        coveragePercent: 82,
        threatMatch: false,
        details:
          "Matches the fusion peptide region of paramyxovirus F protein. Fusion peptides mediate membrane merger during viral entry. This domain alone is non-functional without the full fusion machinery.",
      },
      esmfold: {
        pLDDT: 83.6,
        structuralNotes:
          "Predicted coiled-coil structure with hydrophobic fusion peptide at N-terminus. Heptad repeat regions suggest capacity for 6-helix bundle formation.",
      },
      foldseek: {
        topHit: "Class I fusion protein, paramyxovirus",
        pdbId: "1ZTM",
        tmScore: 0.74,
        organism: "Human parainfluenza virus 3",
        threatMatch: false,
        details:
          "Structural similarity to pre-fusion class I viral fusion peptides. Contains hydrophobic insertion loop characteristic of membrane-fusogenic domains.",
      },
      riskLevel: "MEDIUM",
      riskSummary:
        "Viral fusion peptide with demonstrated structural capacity for membrane interaction. Individually non-functional but provides fusogenic capability when combined with targeting/activation domains.",
    },
  ],
  unified: {
    overallRisk: "FLAG",
    confidence: 0.82,
    summary:
      "No individual domain matches a known select agent or regulated toxin. However, the four-domain architecture of this construct creates significant concern through synergistic effects.",
    synergisticEffects:
      "This construct combines four capabilities that together recapitulate a complete autonomous cell-entry and payload-delivery system:\n\n" +
      "1. Cell-penetrating peptide (D1) → enables initial membrane translocation and cellular uptake\n" +
      "2. dsRNA-binding domain (D2) → provides nucleic acid cargo-binding capability\n" +
      "3. Furin-like protease (D3) → enables self-activation through proteolytic cleavage, mimicking the activation mechanism used by anthrax toxin and Ebola GP\n" +
      "4. Viral fusion peptide (D4) → provides membrane fusion capability for endosomal escape\n\n" +
      "This combination mirrors the functional architecture of engineered delivery vectors that could be repurposed for autonomous toxin delivery. The presence of a self-activating protease alongside membrane-penetrating and fusogenic domains is particularly concerning, as it eliminates the need for host cell proteases in the activation pathway.",
    recommendation:
      "FLAG FOR HUMAN EXPERT REVIEW. The construct requires assessment by a biosecurity specialist to evaluate the functional integration of these domains. Key questions: (1) Is there a legitimate research application for this specific domain combination? (2) Does the furin-like domain retain catalytic activity in this chimeric context? (3) Is the customer affiliated with an institution with appropriate biosafety oversight?",
    flags: [
      "Chimeric construct with no natural homolog",
      "Self-activating protease + membrane fusion capability",
      "Functional architecture parallels engineered delivery systems",
      "Four dual-use domains in a single reading frame",
    ],
  },
};

/**
 * Example 2: SYN-00142
 * Immediately flags — near-identical match to diphtheria toxin.
 */
const report2: SequenceReport = {
  orderId: "SYN-00142",
  description: "Customer synthesis order — protein sequence, 535 aa",
  sequenceLength: 535,
  sequenceType: "protein",
  domainCount: 2,
  domains: [
    {
      domainId: "D1",
      domainName: "Diphtheria toxin translocation domain",
      interproId: "IPR022406",
      range: "1–193",
      diamond: {
        topHit: "Diphtheria toxin precursor [Corynebacterium diphtheriae]",
        organism: "Corynebacterium diphtheriae",
        identity: 94.8,
        evalue: 1.2e-98,
        coveragePercent: 99,
        threatMatch: true,
        details:
          "Near-identical match to the translocation domain of diphtheria toxin (UniProt P00588). This domain forms the transmembrane channel required for delivery of the catalytic A-fragment into the host cell cytoplasm. Regulated under the US Select Agents and Toxins List (7 CFR Part 331, 9 CFR Part 121, 42 CFR Part 73).",
      },
      esmfold: {
        pLDDT: 95.1,
        structuralNotes:
          "High-confidence prediction of the characteristic 9-helix translocation domain. Hydrophobic helical hairpin (TH8-TH9) intact — required for membrane insertion and pore formation at endosomal pH.",
      },
      foldseek: {
        topHit: "Diphtheria toxin, chain A",
        pdbId: "1F0L",
        tmScore: 0.97,
        organism: "Corynebacterium diphtheriae",
        threatMatch: true,
        details:
          "Near-identical structural match to the solved crystal structure of diphtheria toxin translocation domain (PDB 1F0L). TM-score of 0.97 indicates essentially identical fold.",
      },
      riskLevel: "HIGH",
      riskSummary:
        "Direct match to diphtheria toxin translocation domain. This is a critical component of a regulated select agent toxin. 94.8% sequence identity to the reference toxin sequence.",
    },
    {
      domainId: "D2",
      domainName: "ADP-ribosyltransferase catalytic domain",
      interproId: "IPR001159",
      range: "194–535",
      diamond: {
        topHit: "Diphtheria toxin precursor [Corynebacterium diphtheriae]",
        organism: "Corynebacterium diphtheriae",
        identity: 97.1,
        evalue: 2.8e-187,
        coveragePercent: 100,
        threatMatch: true,
        details:
          "Near-identical match to the catalytic A-fragment of diphtheria toxin. This domain catalyzes ADP-ribosylation of elongation factor 2 (EF-2), irreversibly blocking protein synthesis and causing cell death. A single molecule of the catalytic domain is sufficient to kill a cell. HHS/USDA Select Agent.",
      },
      esmfold: {
        pLDDT: 96.3,
        structuralNotes:
          "Complete active site with NAD+ binding pocket fully intact. Catalytic residues (Glu-148, His-21) in correct geometry for ADP-ribosyltransferase activity. This is a fully functional toxin domain.",
      },
      foldseek: {
        topHit: "Diphtheria toxin catalytic domain",
        pdbId: "1TOX",
        tmScore: 0.98,
        organism: "Corynebacterium diphtheriae",
        threatMatch: true,
        details:
          "Essentially identical to the reference crystal structure of diphtheria toxin catalytic domain (PDB 1TOX). All substrate-binding and catalytic residues are conserved.",
      },
      riskLevel: "CRITICAL",
      riskSummary:
        "Direct match to diphtheria toxin catalytic domain — the lethal component of a regulated select agent. 97.1% identity, fully intact active site. Synthesis of this sequence is prohibited without appropriate authorization.",
    },
  ],
  unified: {
    overallRisk: "REJECT",
    confidence: 0.99,
    summary:
      "This sequence is a near-complete match to Corynebacterium diphtheriae diphtheria toxin (UniProt P00588, 535 aa). Both the translocation domain (94.8% identity) and catalytic ADP-ribosyltransferase domain (97.1% identity) are present and structurally intact.",
    synergisticEffects: null,
    recommendation:
      "REJECT — DO NOT SYNTHESIZE. This sequence encodes a functional diphtheria toxin, a regulated select agent under HHS/USDA 42 CFR Part 73. Synthesis, possession, and transfer require Select Agent Program registration (CDC/APHIS). This order must be reported to the institutional biosafety officer and, if required by jurisdiction, to relevant authorities.",
    flags: [
      "Select Agent: Diphtheria toxin (HHS regulated)",
      "Catalytic domain 97.1% identical to reference toxin",
      "Translocation domain structurally intact (TM-score 0.97)",
      "Single molecule lethality — EF-2 ADP-ribosylation",
      "Synthesis prohibited without Select Agent registration",
    ],
  },
};

/**
 * Example 3: ORD-2024-1533
 * No known threats — standard recombinant enzyme. Tentative pass.
 */
const report3: SequenceReport = {
  orderId: "ORD-2024-1533",
  description: "Customer synthesis order — protein sequence, 267 aa",
  sequenceLength: 267,
  sequenceType: "protein",
  domainCount: 2,
  domains: [
    {
      domainId: "D1",
      domainName: "Triosephosphate isomerase (TIM barrel)",
      interproId: "IPR000652",
      range: "1–248",
      diamond: {
        topHit: "Triosephosphate isomerase [Escherichia coli K-12]",
        organism: "Escherichia coli K-12",
        identity: 88.4,
        evalue: 6.1e-112,
        coveragePercent: 100,
        threatMatch: false,
        details:
          "Strong match to E. coli triosephosphate isomerase, a ubiquitous glycolytic enzyme found in virtually all organisms. TPI is one of the most well-characterized enzymes in biochemistry with no known toxin, virulence, or dual-use associations.",
      },
      esmfold: {
        pLDDT: 94.7,
        structuralNotes:
          "Canonical (β/α)₈ TIM barrel fold predicted with high confidence. Active site residues (Lys-12, His-95, Glu-165) positioned correctly. This is the prototypical barrel enzyme fold.",
      },
      foldseek: {
        topHit: "Triosephosphate isomerase",
        pdbId: "1TRE",
        tmScore: 0.93,
        organism: "Escherichia coli",
        threatMatch: false,
        details:
          "Excellent structural match to the canonical TIM barrel (PDB 1TRE). This fold is the most common enzyme fold in nature, found in >10% of all known enzyme structures. No structural similarity to any known threat.",
      },
      riskLevel: "LOW",
      riskSummary:
        "Triosephosphate isomerase is a core metabolic enzyme with no biosecurity concerns. Widely used as a model protein in biochemistry research and education.",
    },
    {
      domainId: "D2",
      domainName: "Polyhistidine affinity tag",
      interproId: "N/A",
      range: "249–267",
      diamond: {
        topHit: "Synthetic construct — 6xHis-tag with GSSG linker",
        organism: "Synthetic",
        identity: 100,
        evalue: 2.3e-4,
        coveragePercent: 100,
        threatMatch: false,
        details:
          "Exact match to a standard hexahistidine purification tag with a GSSG flexible linker. This is the most commonly used affinity tag in recombinant protein production.",
      },
      esmfold: {
        pLDDT: 42.1,
        structuralNotes:
          "Predicted as intrinsically disordered, consistent with the flexible nature of polyhistidine tags. No stable secondary structure expected.",
      },
      foldseek: {
        topHit: "No significant structural match",
        pdbId: null,
        tmScore: 0,
        organism: "N/A",
        threatMatch: false,
        details:
          "No meaningful structural match due to intrinsically disordered nature. His-tags do not adopt a defined fold in isolation.",
      },
      riskLevel: "LOW",
      riskSummary:
        "Standard recombinant protein purification tag. Present in millions of commercially available expression constructs. No biosecurity relevance.",
    },
  ],
  unified: {
    overallRisk: "PASS",
    confidence: 0.96,
    summary:
      "This sequence encodes a recombinant E. coli triosephosphate isomerase with a C-terminal 6xHis purification tag. This is a standard molecular biology construct consistent with protein expression for research or educational purposes.",
    synergisticEffects: null,
    recommendation:
      "TENTATIVE PASS — Recommend routine administrative review. This appears to be a standard recombinant enzyme expression construct. Verify customer institutional affiliation and intended use as part of standard compliance workflow. No biosecurity concerns identified.",
    flags: [],
  },
};

export const mockReports: SequenceReport[] = [report1, report2, report3];

export function getReportByOrderId(orderId: string): SequenceReport | undefined {
  return mockReports.find((r) => r.orderId === orderId);
}
