import type { SequenceReport } from "./report-types";

/**
 * Mock report for the ricin-like Type II RIP sequence.
 * Two structural domains: A-chain (ribosome-inactivating) + B-chain (lectin).
 */
export const mockRicinReport: SequenceReport = {
  id: "mock-ricin-001",
  inputSequence:
    "MKPGGNTIVIWMYAVATWLCFGSTSGWSFTLEDNNIFPKQYPIINFTTAGATVQSYTNFIRAVRGRLTTGADVRHEIPVLPNRVGLPINQRFILVELSNHAELSVTLALDVTNAYVVGYRAGNSAYFFHPDNQEDAEAITHLFTDVQNRYTFAFGGNYDRLEQLAGNLRENIELGNGPLEEAISALYYYSTGGTQLPTLARSFIICIQMISEAARFQYIEGEMRTRIRYNRRSAPDPSVITLENSWGRLSTAIQESNQGAFASPIQLQRRNGSKFSVYDVSILIPIIALMVYRCAPPPSSQFSLLIRPVVPNFNADVCMDPEPIVRIVGRNGLCVDVRDGRFHNGNAIQLWPCKSNTDANQLWTLKRDNTIRSNGKCLTTYGYSPGVYVMIYDCNTAATDATRWQIWDNGTIINPRSSLVLAATSGNSGTTLTVQTNIYAVSQGWLPTNNTQPFVTTIVGLYGLCLQANSGQVWIEDCSSEKAEQQWALYADGSIRPQQNRDNCLTSDSNIRETVVKILSCGPASSGQRWMFKNDGTILNLYSGLVLDVRASDPSLKQIILYPLHGDPNQIWLPLF",
  sequenceLength: 576,
  status: "completed",
  domains: [
    {
      domain: {
        sequence:
          "IFPKQYPIINFTTAGATVQSYTNFIRAVRGRLTTGADVRHEIPVLPNRVGLPINQRFILVELSNHAELSVTLALDVTNAYVVGYRAGNSAYFFHPDNQEDAEAITHLFTDVQNRYTFAFGGNYDRLEQLAGNLRENIELGNGPLEEAISALYYYSTGGTQLPTLARSFIICIQMISEAARFQYIEGEMRTRIRYNRRSAPDPSVITLENSWGRLSTAIQESNQGAFASPIQLQRRNGSKFSVYDVSILIPIIALMVYRCAPPPSSQFSLLIRPVVPNFNADVCMDPEPIVRIVGRNGLCVDVRDGRFHNGNAIQLWP",
        start: 36,
        end: 319,
        annotation: "Ribosome-inactivating protein",
        signatures: ["IPR016138", "IPR001574", "IPR036041", "IPR017989"],
        isLinker: false,
        metadata: [
          {
            signature: "IPR017988",
            description: "Ribosome_inactivat_prot_CS",
            type: "CONSERVED_SITE",
          },
        ],
      },
      diamond: {
        status: "completed",
        durationMs: 4200,
        hits: [
          {
            accession: "P02879",
            title: "Ricin A chain precursor",
            organism: "Ricinus communis",
            identity: 98.2,
            coverage: 97.5,
            evalue: 0,
            bitScore: 612,
            threatFlags: ["select_agent", "toxin"],
          },
          {
            accession: "P24476",
            title: "Abrin-a A chain",
            organism: "Abrus precatorius",
            identity: 51.3,
            coverage: 89.2,
            evalue: 2.1e-78,
            bitScore: 298,
            threatFlags: ["select_agent", "toxin"],
          },
          {
            accession: "Q8W1S0",
            title: "Type I RIP - Trichosanthin",
            organism: "Trichosanthes kirilowii",
            identity: 32.1,
            coverage: 72.4,
            evalue: 1.8e-22,
            bitScore: 105,
            threatFlags: [],
          },
        ],
        riskSignal: "HIGH",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-ricin-a.pdb",
        plddtMean: 91.4,
        plddtPerResidue: Array.from({ length: 284 }, () =>
          Math.round(85 + Math.random() * 10)
        ),
        confidenceCategory: "very_high",
      },
      foldseek: {
        status: "completed",
        durationMs: 8300,
        hits: [
          {
            pdbId: "2AAI",
            uniprotId: "P02879",
            proteinName: "Ricin A chain",
            organism: "Ricinus communis",
            probability: 0.99,
            evalue: 1.2e-45,
            keywords: ["Toxin", "Select Agent"],
            flagged: true,
            riskKeywords: ["Toxin"],
          },
          {
            pdbId: "1ABR",
            uniprotId: "P11140",
            proteinName: "Abrin-a",
            organism: "Abrus precatorius",
            probability: 0.97,
            evalue: 3.4e-38,
            keywords: ["Toxin", "Select Agent"],
            flagged: true,
            riskKeywords: ["Toxin"],
          },
        ],
        riskSignal: "HIGH",
      },
      summary: {
        riskLevel: "HIGH",
        confidence: 0.98,
        reasoning:
          "This domain is a ribosome-inactivating protein (RIP) A-chain with 98.2% identity to ricin. It contains the N-glycosidase catalytic site that depurinates 28S rRNA, irreversibly inactivating eukaryotic ribosomes and halting protein synthesis. Both Diamond sequence alignment and Foldseek structural search confirm near-identical matches to ricin (Ricinus communis), a federally regulated Select Agent toxin. The ESMFold structure prediction shows high confidence (pLDDT 91.4), and the predicted fold is consistent with known RIP crystal structures.",
        flags: [
          "98.2% identity to ricin A chain (P02879)",
          "N-glycosidase catalytic domain confirmed",
          "Select Agent — US Federal Select Agent Program",
          "Structural match to PDB 2AAI (ricin)",
        ],
      },
      progress: {
        diamond: "completed",
        structure: "completed",
        foldseek: "completed",
        summary: "completed",
      },
    },
    {
      domain: {
        sequence:
          "CKSNTDANQLWTLKRDNTIRSNGKCLTTYGYSPGVYVMIYDCNTAATDATRWQIWDNGTIINPRSSLVLAATSGNSGTTLTVQTNIYAVSQGWLPTNNTQPFVTTIVGLYGLCLQANSGQVWIEDCSSEKAEQQWALYADGSIRPQQNRDNCLTSDSNIRETVVKILSCGPASSGQRWMFKNDGTILNLYSGLVLDVRASDPSLKQIILYPLHGDPNQIWLPLF",
        start: 322,
        end: 576,
        annotation: "Ricin B lectin",
        signatures: ["IPR000772", "IPR035992"],
        isLinker: false,
        metadata: [
          {
            signature: "IPR035992",
            description: "Ricin_B-like_lectins",
            type: "HOMOLOGOUS_SUPERFAMILY",
          },
        ],
      },
      diamond: {
        status: "completed",
        durationMs: 3800,
        hits: [
          {
            accession: "P02879",
            title: "Ricin B chain",
            organism: "Ricinus communis",
            identity: 97.8,
            coverage: 98.1,
            evalue: 0,
            bitScore: 485,
            threatFlags: ["select_agent", "toxin"],
          },
          {
            accession: "P11140",
            title: "Abrin B chain",
            organism: "Abrus precatorius",
            identity: 45.2,
            coverage: 91.7,
            evalue: 6.3e-52,
            bitScore: 212,
            threatFlags: ["select_agent", "toxin"],
          },
        ],
        riskSignal: "HIGH",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-ricin-b.pdb",
        plddtMean: 88.7,
        plddtPerResidue: Array.from({ length: 255 }, () =>
          Math.round(82 + Math.random() * 12)
        ),
        confidenceCategory: "confident",
      },
      foldseek: {
        status: "completed",
        durationMs: 7100,
        hits: [
          {
            pdbId: "2AAI",
            uniprotId: "P02879",
            proteinName: "Ricin B chain",
            organism: "Ricinus communis",
            probability: 0.99,
            evalue: 8.7e-41,
            keywords: ["Toxin", "Lectin", "Cell binding"],
            flagged: true,
            riskKeywords: ["Toxin"],
          },
        ],
        riskSignal: "HIGH",
      },
      summary: {
        riskLevel: "HIGH",
        confidence: 0.97,
        reasoning:
          "This domain is a Ricin B-type lectin with 97.8% identity to the ricin B chain. The B chain functions as a galactose-binding lectin that binds cell surface glycoproteins and glycolipids, enabling endocytosis of the holotoxin. Without a delivery mechanism like this lectin, the A-chain catalytic domain cannot enter cells efficiently. The Ricin B lectin is the critical cell-entry component that transforms a ribosome-inactivating enzyme into a potent whole-organism toxin.",
        flags: [
          "97.8% identity to ricin B chain (P02879)",
          "Galactose-binding lectin — cell entry domain",
          "Enables endocytic uptake of catalytic A-chain",
          "Select Agent component",
        ],
      },
      progress: {
        diamond: "completed",
        structure: "completed",
        foldseek: "completed",
        summary: "completed",
      },
    },
  ],
  integratedReport: {
    overallRisk: "HIGH",
    confidence: 0.99,
    architectureSummary:
      "A-chain (Ribosome-inactivating protein, 36–319) → B-chain (Ricin B lectin, 322–576)",
    synergisticFactors: [
      {
        domains: [
          "Ribosome-inactivating protein",
          "Ricin B lectin",
        ],
        concern:
          "Type II RIP architecture: the enzymatic A-chain depurinates ribosomes to halt protein synthesis, while the B-chain lectin binds cell surface galactose residues to mediate toxin internalization via endocytosis. Neither domain alone is as dangerous — the A-chain cannot enter cells without the B-chain delivery mechanism. Together they constitute a functional holotoxin matching ricin, a US Select Agent.",
        riskContribution: "HIGH",
      },
    ],
    reasoning:
      "This sequence encodes a complete Type II ribosome-inactivating protein (RIP) with the classic A-B toxin architecture. The A-chain (residues 36–319) is a potent N-glycosidase that catalytically inactivates eukaryotic ribosomes by depurinating a specific adenine in 28S rRNA. The B-chain (residues 322–576) is a galactose-binding lectin that mediates cell surface binding and endocytic uptake.\n\nThe synergistic combination is critical: Type I RIPs (A-chain only) are orders of magnitude less toxic than Type II RIPs because they lack a cell-entry mechanism. The B-chain lectin transforms a moderately toxic enzyme into one of the most potent biological toxins known.\n\nBoth chains show >97% sequence identity to ricin (Ricinus communis, P02879) and structural similarity confirmed by Foldseek against PDB 2AAI. Ricin is classified as a Select Agent under the US Federal Select Agent Program and is regulated under the Chemical Weapons Convention.",
    flags: [
      "Type II RIP holotoxin — catalytic + delivery domains",
      "98.2% identity to ricin A chain, 97.8% to ricin B chain",
      "US Federal Select Agent (HHS/USDA)",
      "Structural homology confirmed (PDB 2AAI)",
      "Synergistic A+B architecture increases toxicity by ~1000x vs A-chain alone",
    ],
  },
  startedAt: "2026-03-21T18:30:00.000Z",
  completedAt: "2026-03-21T18:32:45.000Z",
};

/**
 * Mock report for c-Src kinase — benign multi-domain protein.
 */
export const mockSrcReport: SequenceReport = {
  id: "mock-src-001",
  inputSequence:
    "MGSNKSKPKDASQRRRSLEPAENVHGAGGGAFPASQTPSKPASADGHRGPSAAFAPAAAEPKLFGGFNSSDTVTSPQRAGPLAGGVTTFVALYDYESRTETDLSFKKGERLQIVNNTEGDWWLAHSLSTGQTGYIPSNYVAPSDSIQAEEWYFGKITRRESERLLLNAENPRGTFLVRESETTKGAYCLSVSDFDNAKGLNVKHYKIRKLDSGGFYITSRTQFNSLQQLVAYYSKHADGLCHRLTTVCPTSKPQTQGLAKDAWEIPRESLRLEVKLGQGCFGEVWMGTWNGTTRVAIKTLKPGTMSPEAFLQEAQVMKKLRHEKLVQLYAVVSEEPIYIVTEYMSKGSLLDFLKGETGKYLRLPQLVDMAAQIASGMAYVERMNYVHRDLRAANILVGENLVCKVADFGLARLIEDNEYTARQGAKFPIKWTAPEAALYGRFTIKSDVWSFGILLTELTTKGRVPYPGMVNREVLDQVERGYRMPCPPECPESLHDLMCQCWRKEPEERPTFEYLQAFLEDYFTSTEPQYQPGENL",
  sequenceLength: 536,
  status: "completed",
  domains: [
    {
      domain: {
        sequence:
          "FGGFNSSDTVTSPQRAGPLAGGVTTFVALYDYESRTETDLSFKKGERLQIVNNTEGDWWLAHSLSTGQTGYIPSNYVAPSDS",
        start: 84,
        end: 145,
        annotation: "SH3 domain",
        signatures: ["IPR001452"],
        isLinker: false,
        metadata: [],
      },
      diamond: {
        status: "completed",
        durationMs: 2100,
        hits: [
          {
            accession: "P12931",
            title: "Proto-oncogene tyrosine-protein kinase Src",
            organism: "Homo sapiens",
            identity: 100,
            coverage: 100,
            evalue: 2.1e-38,
            bitScore: 142,
            threatFlags: [],
          },
        ],
        riskSignal: "LOW",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-src-sh3.pdb",
        plddtMean: 93.2,
        plddtPerResidue: Array.from({ length: 62 }, () =>
          Math.round(90 + Math.random() * 7)
        ),
        confidenceCategory: "very_high",
      },
      foldseek: {
        status: "completed",
        durationMs: 5200,
        hits: [
          {
            pdbId: "1SRC",
            uniprotId: "P12931",
            proteinName: "Tyrosine-protein kinase Src",
            organism: "Homo sapiens",
            probability: 0.99,
            evalue: 1.5e-12,
            keywords: ["Kinase", "SH3"],
            flagged: false,
            riskKeywords: [],
          },
        ],
        riskSignal: "LOW",
      },
      summary: {
        riskLevel: "LOW",
        confidence: 0.95,
        reasoning:
          "Standard SH3 domain found in Src-family kinases. 100% identity to human c-Src (P12931). SH3 domains mediate protein-protein interactions via proline-rich motif binding and are ubiquitous in eukaryotic signaling proteins. No association with pathogenicity.",
        flags: [
          "100% identity to human c-Src SH3",
          "Standard signaling domain",
        ],
      },
      progress: {
        diamond: "completed",
        structure: "completed",
        foldseek: "completed",
        summary: "completed",
      },
    },
    {
      domain: {
        sequence:
          "IQAEEWYFGKITRRESERLLLNAENPRGTFLVRESETTKGAYCLSVSDFDNAKGLNVKHYKIRKLDSGGFYITSRTQFNSLQQLVAYYSKHADGLCHRLTTVCPTSKPQTQ",
        start: 146,
        end: 248,
        annotation: "SH2 domain",
        signatures: ["IPR000980"],
        isLinker: false,
        metadata: [],
      },
      diamond: {
        status: "completed",
        durationMs: 1900,
        hits: [
          {
            accession: "P12931",
            title: "Proto-oncogene tyrosine-protein kinase Src",
            organism: "Homo sapiens",
            identity: 100,
            coverage: 100,
            evalue: 8.4e-62,
            bitScore: 228,
            threatFlags: [],
          },
        ],
        riskSignal: "LOW",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-src-sh2.pdb",
        plddtMean: 92.1,
        plddtPerResidue: Array.from({ length: 103 }, () =>
          Math.round(88 + Math.random() * 9)
        ),
        confidenceCategory: "very_high",
      },
      foldseek: {
        status: "completed",
        durationMs: 4800,
        hits: [
          {
            pdbId: "1SRC",
            uniprotId: "P12931",
            proteinName: "Tyrosine-protein kinase Src",
            organism: "Homo sapiens",
            probability: 0.99,
            evalue: 2.8e-18,
            keywords: ["Kinase", "SH2", "Phosphotyrosine binding"],
            flagged: false,
            riskKeywords: [],
          },
        ],
        riskSignal: "LOW",
      },
      summary: {
        riskLevel: "LOW",
        confidence: 0.95,
        reasoning:
          "Standard SH2 domain from human c-Src. SH2 domains bind phosphorylated tyrosine residues to regulate intracellular signaling cascades. This is one of the most common and well-characterized domain types in the human proteome with no biosecurity relevance.",
        flags: [
          "100% identity to human c-Src SH2",
          "Phosphotyrosine-binding signaling domain",
        ],
      },
      progress: {
        diamond: "completed",
        structure: "completed",
        foldseek: "completed",
        summary: "completed",
      },
    },
    {
      domain: {
        sequence:
          "GLAKDAWEIPRESLRLEVKLGQGCFGEVWMGTWNGTTRVAIKTLKPGTMSPEAFLQEAQVMKKLRHEKLVQLYAVVSEEPIYIVTEYMSKGSLLDFLKGETGKYLRLPQLVDMAAQIASGMAYVERMNYVHRDLRAANILVGENLVCKVADFGLARLIEDNEYTARQGAKFPIKWTAPEAALYGRFTIKSDVWSFGILLTELTTKGRVPYPGMVNREVLDQVERGYRMPCPPECPESLHDLMCQCWRKEPEERPTFEYLQAFLEDYFTSTEPQYQPGENL",
        start: 270,
        end: 536,
        annotation: "Protein kinase domain",
        signatures: ["IPR000719", "IPR020635"],
        isLinker: false,
        metadata: [
          {
            signature: "IPR017441",
            description: "Protein_kinase_ATP_BS",
            type: "BINDING_SITE",
          },
          {
            signature: "IPR008266",
            description: "Tyr_kinase_AS",
            type: "ACTIVE_SITE",
          },
        ],
      },
      diamond: {
        status: "completed",
        durationMs: 2400,
        hits: [
          {
            accession: "P12931",
            title: "Proto-oncogene tyrosine-protein kinase Src",
            organism: "Homo sapiens",
            identity: 100,
            coverage: 100,
            evalue: 0,
            bitScore: 548,
            threatFlags: [],
          },
        ],
        riskSignal: "LOW",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-src-kinase.pdb",
        plddtMean: 89.5,
        plddtPerResidue: Array.from({ length: 267 }, () =>
          Math.round(84 + Math.random() * 11)
        ),
        confidenceCategory: "confident",
      },
      foldseek: {
        status: "completed",
        durationMs: 6100,
        hits: [
          {
            pdbId: "2SRC",
            uniprotId: "P12931",
            proteinName: "Tyrosine-protein kinase Src",
            organism: "Homo sapiens",
            probability: 1.0,
            evalue: 1.1e-52,
            keywords: ["Kinase", "Transferase", "ATP-binding"],
            flagged: false,
            riskKeywords: [],
          },
        ],
        riskSignal: "LOW",
      },
      summary: {
        riskLevel: "LOW",
        confidence: 0.93,
        reasoning:
          "Tyrosine kinase catalytic domain identical to human c-Src. Contains the conserved ATP-binding site and catalytic loop. Tyrosine kinases are fundamental to eukaryotic cell signaling — growth, differentiation, and metabolism. While Src is a proto-oncogene (gain-of-function mutations can contribute to cancer), its wild-type form is a normal human protein with no biosecurity implications.",
        flags: [
          "100% identity to human c-Src kinase domain",
          "Proto-oncogene (cancer relevance, not biosecurity)",
          "Standard ATP-binding kinase fold",
        ],
      },
      progress: {
        diamond: "completed",
        structure: "completed",
        foldseek: "completed",
        summary: "completed",
      },
    },
  ],
  integratedReport: {
    overallRisk: "LOW",
    confidence: 0.96,
    architectureSummary:
      "SH3 domain (84–145) → SH2 domain (146–248) → Tyrosine kinase (270–536)",
    synergisticFactors: [],
    reasoning:
      "This sequence encodes human c-Src (P12931), the prototypical non-receptor tyrosine kinase. The SH3 → SH2 → kinase domain architecture is the hallmark of Src-family kinases, which are fundamental regulators of cell signaling in all vertebrates.\n\nNo synergistic risk factors were identified. The three domains function together as a signaling switch: SH3 and SH2 mediate autoinhibition and substrate recognition, while the kinase domain catalyzes tyrosine phosphorylation. This is a well-characterized human protein with no association with toxins, virulence factors, or biological weapons.\n\nWhile c-Src is a proto-oncogene (constitutive activation contributes to some cancers), oncogene status does not constitute a biosecurity risk — the protein is endogenous to every human cell.",
    flags: [
      "100% match to human c-Src (P12931)",
      "Standard Src-family kinase architecture",
      "No toxin, virulence, or dual-use domains",
      "Proto-oncogene (cancer research relevance only)",
    ],
  },
  startedAt: "2026-03-21T18:35:00.000Z",
  completedAt: "2026-03-21T18:37:12.000Z",
};