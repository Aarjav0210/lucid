import type { SequenceReport } from "./report-types";

/**
 * HIGH RISK — Ricin-like Type II RIP (Rejected)
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
            qStart: 1,
            qEnd: 284,
            queryLength: 284,
            qseq: "IFPKQYPIINFTTAGATVQSYTNFIRAVRGRLTTGADVRHEIPVLPNRVGLPINQRFILVELSNHAELSVTLALDVTNAYVVGYRAGNSAYFFHPDNQEDAEAITHLFTDVQNRYTFAFGGNYDRLEQLAGNLRENIELGNGPLEEAISALYYYSTGGTQLPTLARSFIICIQMISEAARFQYIEGEMRTRIRYNRRSAPDPSVITLENSWGRLSTAIQESNQGAFASPIQLQRRNGSKFSVYDVSILIPIIALMVY",
            sseq: "IFPKQYPIINFTTAGATVQSYTNFIRAVRGRLTTGADVRHEIPVLPNRVGLPINQRFILVELSNHAELSVTLALDVTNAYVVGYRAGNSAYFFHPDNQEDAEAITHLFTDVQNRYTFAFGGNYDRLEQLAGNLRENIELGNGPLEEAISALYYYSTGGTQLPTLARSFIICIQMISEAARFQYIEGEMRTRIRYNRRSAPDPSVITLENSWGRLSTAIQESNQGAFASPIQLQRRNGSKFSVYDVSILIPIIALMVY",
          },
        ],
        riskSignal: "HIGH",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-ricin-a.pdb",
        pdbUrl: "/sample-pdbs/ricin-a-chain.pdb",
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
          "This domain is a ribosome-inactivating protein (RIP) A-chain with 98.2% identity to ricin. It contains the N-glycosidase catalytic site that depurinates 28S rRNA, irreversibly inactivating eukaryotic ribosomes. Both Diamond and Foldseek confirm near-identical matches to ricin, a federally regulated Select Agent toxin.",
        flags: ["toxin:2", "select_agent:2"],
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
        metadata: [],
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
            qStart: 1,
            qEnd: 255,
            queryLength: 255,
            qseq: "CKSNTDANQLWTLKRDNTIRSNGKCLTTYGYSPGVYVMIYDCNTAATDATRWQIWDNGTIINPRSSLVLAATSGNSGTTLTVQTNIYAVSQGWLPTNNTQPFVTTIVGLYGLCLQANSGQVWIEDCSSEKAEQQWALYADGSIRPQQNRDNCLTSDSNIRETVVKILSCGPASSGQRWMFKNDGTILNLYSGLVLDVRASDPSLKQIILYPLHGDPNQIWLPLF",
            sseq: "CKSNTDANQLWTLKRDNTIRSNGKCLTTYGYSPGVYVMIYDCNTAATDATRWQIWDNGTIINPRSSLVLAATSGNSGTTLTVQTNIYAVSQGWLPTNNTQPFVTTIVGLYGLCLQANSGQVWIEDCSSEKAEQQWALYADGSIRPQQNRDNCLTSDSNIRETVVKILSCGPASSGQRWMFKNDGTILNLYSGLVLDVRASDPSLKQIILYPLHGDPNQIWLPLF",
          },
        ],
        riskSignal: "HIGH",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-ricin-b.pdb",
        pdbUrl: "/sample-pdbs/ricin-b-chain.pdb",
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
          "This domain is a Ricin B-type lectin with 97.8% identity to the ricin B chain. It functions as a galactose-binding lectin enabling endocytosis of the holotoxin — the critical cell-entry component.",
        flags: ["toxin:2", "select_agent:1"],
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
        domains: ["Ribosome-inactivating protein", "Ricin B lectin"],
        concern:
          "Type II RIP architecture: the enzymatic A-chain depurinates ribosomes while the B-chain lectin mediates toxin internalization. Together they constitute a functional holotoxin matching ricin, a US Select Agent.",
        riskContribution: "HIGH",
      },
    ],
    reasoning:
      "This sequence encodes a complete Type II ribosome-inactivating protein with the classic A-B toxin architecture. Both chains show >97% identity to ricin (Ricinus communis). Ricin is classified as a Select Agent under the US Federal Select Agent Program.",
    decision: "Rejected",
    flags: [
      "Type II RIP holotoxin",
      "98.2% identity to ricin A chain",
      "US Federal Select Agent",
      "Synergistic A+B architecture",
    ],
  },
  startedAt: "2026-03-21T18:30:00.000Z",
  completedAt: "2026-03-21T18:32:45.000Z",
};

/**
 * MEDIUM RISK — Chimeric construct with partial toxin homology (Manual Validation)
 */
export const mockChimericReport: SequenceReport = {
  id: "mock-chimeric-001",
  inputSequence:
    "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQQIAATGFHISDTHRGDTYGIFQINSRYWCNDGKTPGAVDGCHPFNYSRLHYLKQSDPDSELVQFGGLGKHAGRGGGFEPANLARGGIINPRSSLVLAATSGNSGTTLTVQTNIYAVSQGWLPTNNTQPFVTTIVGLYGLCLQANSGQVWI",
  sequenceLength: 221,
  status: "completed",
  domains: [
    {
      domain: {
        sequence:
          "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQQIAATGFHISDTHRGDTYGIFQINSRYWCNDGKTPGAVDGCHPFNYSRLHYLKQSDPDSELVQFGGLGKHAGRGGG",
        start: 1,
        end: 152,
        annotation: "N-glycosidase domain",
        signatures: ["IPR016138"],
        isLinker: false,
        metadata: [],
      },
      diamond: {
        status: "completed",
        durationMs: 3100,
        hits: [
          {
            accession: "Q8W1S0",
            title: "Trichosanthin (Type I RIP)",
            organism: "Trichosanthes kirilowii",
            identity: 42.5,
            coverage: 78.3,
            evalue: 3.2e-18,
            bitScore: 92,
            threatFlags: ["toxin"],
            qStart: 5,
            qEnd: 148,
            queryLength: 152,
            qseq: "YIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQ-DNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQQIAATGFHI-SDTHRGDTYGIFQINSRYWCNDGKTPGAVDGCHPFNYSRLHYLKQSDPDSELVQF",
            sseq: "YISKQRPISFVKSHYTARLEEALGLIEVQAPILSRVGDGSQDADLSAAEKAVQIKVKSLPDAQFEVAHSLAKWKREQIAATGFHITDDAHRGDTYGIFQINSRYWCNDGKTPRAVDACHPFNYSRLHYLKQSDPDAELVQF",
          },
        ],
        riskSignal: "MEDIUM",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-chimeric-a.pdb",
        pdbUrl: "/sample-pdbs/trichosanthin.pdb",
        plddtMean: 74.2,
        plddtPerResidue: Array.from({ length: 152 }, () =>
          Math.round(65 + Math.random() * 20)
        ),
        confidenceCategory: "confident",
      },
      foldseek: {
        status: "completed",
        durationMs: 6200,
        hits: [
          {
            pdbId: "1MRJ",
            uniprotId: "Q8W1S0",
            proteinName: "Trichosanthin",
            organism: "Trichosanthes kirilowii",
            probability: 0.85,
            evalue: 4.1e-12,
            keywords: ["Toxin", "N-glycosidase"],
            flagged: true,
            riskKeywords: ["Toxin"],
          },
        ],
        riskSignal: "MEDIUM",
      },
      summary: {
        riskLevel: "MEDIUM",
        confidence: 0.72,
        reasoning:
          "This domain shows moderate similarity (42.5% identity) to trichosanthin, a Type I ribosome-inactivating protein. While not a direct match to a Select Agent, the N-glycosidase catalytic activity could pose risk if combined with a delivery mechanism.",
        flags: ["toxin:1"],
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
          "FEPANLARGGIINPRSSLVLAATSGNSGTTLTVQTNIYAVSQGWLPTNNTQPFVTTIVGLYGLCLQANSGQVWI",
        start: 149,
        end: 221,
        annotation: "Lectin-like domain",
        signatures: ["IPR000772"],
        isLinker: false,
        metadata: [],
      },
      diamond: {
        status: "completed",
        durationMs: 2800,
        hits: [
          {
            accession: "P02879",
            title: "Ricin B chain fragment",
            organism: "Ricinus communis",
            identity: 88.4,
            coverage: 62.1,
            evalue: 1.2e-28,
            bitScore: 128,
            threatFlags: ["toxin"],
            qStart: 1,
            qEnd: 73,
            queryLength: 73,
            qseq: "FEPANLARGGIINPRSSLVLAATSGNSGTTLTVQTNIYAVSQGWLPTNNTQPFVTTIVGLYGLCLQANSGQVWI",
            sseq: "FEPANLARGGIINPRSSLVLAATSGNSGTTLTVQTNIYAVSQGWLPTNNTQPFVTTIVGLYGLCLQANSGQVWI",
          },
        ],
        riskSignal: "MEDIUM",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-chimeric-b.pdb",
        pdbUrl: "/sample-pdbs/ricin-b-fragment.pdb",
        plddtMean: 68.9,
        plddtPerResidue: Array.from({ length: 73 }, () =>
          Math.round(60 + Math.random() * 18)
        ),
        confidenceCategory: "low",
      },
      foldseek: {
        status: "completed",
        durationMs: 5400,
        hits: [
          {
            pdbId: "2AAI",
            uniprotId: "P02879",
            proteinName: "Ricin B chain",
            organism: "Ricinus communis",
            probability: 0.78,
            evalue: 2.3e-8,
            keywords: ["Lectin", "Cell binding"],
            flagged: true,
            riskKeywords: ["Toxin"],
          },
        ],
        riskSignal: "MEDIUM",
      },
      summary: {
        riskLevel: "MEDIUM",
        confidence: 0.68,
        reasoning:
          "This truncated lectin-like domain shows 88.4% identity to a fragment of the ricin B chain. While incomplete, it retains potential galactose-binding capability that could facilitate cell entry of a catalytic domain. The low pLDDT (68.9) suggests uncertain folding.",
        flags: ["toxin:1"],
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
    overallRisk: "MEDIUM",
    confidence: 0.75,
    architectureSummary:
      "N-glycosidase domain (1–152) → Lectin-like domain (149–221)",
    synergisticFactors: [
      {
        domains: ["N-glycosidase domain", "Lectin-like domain"],
        concern:
          "Potential chimeric RIP construct: the N-glycosidase has partial similarity to Type I RIPs, and the truncated lectin domain resembles a ricin B chain fragment. This combination could reconstitute a delivery mechanism, though both domains show only partial homology.",
        riskContribution: "MEDIUM",
      },
    ],
    reasoning:
      "This construct contains a partial N-glycosidase domain with moderate similarity to trichosanthin (42.5%) fused to a truncated lectin domain matching ricin B chain (88.4%). While neither domain is a complete threat on its own, the chimeric architecture suggests a possible attempt to engineer a toxin delivery system. The incomplete nature and low structural confidence warrant expert review.",
    decision: "Manual Validation",
    flags: [
      "Partial RIP catalytic domain",
      "Truncated ricin B lectin fragment",
      "Chimeric architecture — possible engineered construct",
    ],
  },
  startedAt: "2026-03-22T10:15:00.000Z",
  completedAt: "2026-03-22T10:17:30.000Z",
};

/**
 * LOW RISK — Human c-Src kinase (Approved)
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
            qStart: 1,
            qEnd: 62,
            queryLength: 62,
            qseq: "FGGFNSSDTVTSPQRAGPLAGGVTTFVALYDYESRTETDLSFKKGERLQIVNNTEGDWWLAHS",
            sseq: "FGGFNSSDTVTSPQRAGPLAGGVTTFVALYDYESRTETDLSFKKGERLQIVNNTEGDWWLAHS",
          },
        ],
        riskSignal: "LOW",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-src-sh3.pdb",
        pdbUrl: "/sample-pdbs/src-sh3.pdb",
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
          "Standard SH3 domain found in Src-family kinases. 100% identity to human c-Src (P12931). No association with pathogenicity.",
        flags: [],
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
            qStart: 1,
            qEnd: 103,
            queryLength: 103,
            qseq: "IQAEEWYFGKITRRESERLLLNAENPRGTFLVRESETTKGAYCLSVSDFDNAKGLNVKHYKIRKLDSGGFYITSRTQFNSLQQLVAYYSKHADGLCHRLTTVCPTSKPQTQ",
            sseq: "IQAEEWYFGKITRRESERLLLNAENPRGTFLVRESETTKGAYCLSVSDFDNAKGLNVKHYKIRKLDSGGFYITSRTQFNSLQQLVAYYSKHADGLCHRLTTVCPTSKPQTQ",
          },
        ],
        riskSignal: "LOW",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-src-sh2.pdb",
        pdbUrl: "/sample-pdbs/src-sh2.pdb",
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
          "Standard SH2 domain from human c-Src. SH2 domains bind phosphorylated tyrosine residues to regulate intracellular signaling cascades. No biosecurity relevance.",
        flags: [],
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
        metadata: [],
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
            qStart: 1,
            qEnd: 267,
            queryLength: 267,
            qseq: "GLAKDAWEIPRESLRLEVKLGQGCFGEVWMGTWNGTTRVAIKTLKPGTMSPEAFLQEAQVMKKLRHEKLVQLYAVVSEEPIYIVTEYMSKGSLLDFLKGETGKYLRLPQLVDMAAQIASGMAYVERMNYVHRDLRAANILVGENLVCKVADFGLARLIEDNEYTARQGAKFPIKWTAPEAALYGRFTIKSDVWSFGILLTELTTKGRVPYPGMVNREVLDQVERGYRMPCPPECPESLHDLMCQCWRKEPEERPTFEYLQAFLEDYFTSTEPQYQPGENL",
            sseq: "GLAKDAWEIPRESLRLEVKLGQGCFGEVWMGTWNGTTRVAIKTLKPGTMSPEAFLQEAQVMKKLRHEKLVQLYAVVSEEPIYIVTEYMSKGSLLDFLKGETGKYLRLPQLVDMAAQIASGMAYVERMNYVHRDLRAANILVGENLVCKVADFGLARLIEDNEYTARQGAKFPIKWTAPEAALYGRFTIKSDVWSFGILLTELTTKGRVPYPGMVNREVLDQVERGYRMPCPPECPESLHDLMCQCWRKEPEERPTFEYLQAFLEDYFTSTEPQYQPGENL",
          },
        ],
        riskSignal: "LOW",
      },
      structure: {
        status: "completed",
        pdbPath: "data/pdb/mock-src-kinase.pdb",
        pdbUrl: "/sample-pdbs/src-kinase.pdb",
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
          "Tyrosine kinase catalytic domain identical to human c-Src. Standard ATP-binding kinase fold with no biosecurity implications.",
        flags: [],
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
      "This sequence encodes human c-Src (P12931), the prototypical non-receptor tyrosine kinase. The SH3 → SH2 → kinase architecture is the hallmark of Src-family kinases. No toxin, virulence, or dual-use domains detected. While c-Src is a proto-oncogene, this does not constitute a biosecurity risk.",
    decision: "Approved",
    flags: [],
  },
  startedAt: "2026-03-21T18:35:00.000Z",
  completedAt: "2026-03-21T18:37:12.000Z",
};

export const sampleReports = [
  { label: "Ricin Holotoxin", description: "Type II RIP — HIGH risk", report: mockRicinReport },
  { label: "Chimeric Construct", description: "Partial toxin homology — MEDIUM risk", report: mockChimericReport },
  { label: "Human c-Src Kinase", description: "Benign signaling protein — LOW risk", report: mockSrcReport },
];
