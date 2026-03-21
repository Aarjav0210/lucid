export interface ThreatEntry {
  accession: string;
  geneName: string;
  organism: string;
  category: "select_agent" | "toxin" | "dual_use" | "gain_of_function";
  regulatoryList: "HHS" | "USDA" | "Overlap" | "CDC" | "None";
  description: string;
}

// Curated catalog of known threat-associated sequences.
// Each entry maps an NCBI accession to metadata used for risk classification.
// When BLAST hits match these accessions, the risk signal is elevated.
export const threatCatalog: ThreatEntry[] = [
  // ── Select Agent Toxins ──────────────────────────────────────────────
  {
    accession: "P02879",
    geneName: "Ricin A-chain",
    organism: "Ricinus communis",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Ricin toxin A-chain; ribosome-inactivating protein",
  },
  {
    accession: "P02880",
    geneName: "Ricin B-chain",
    organism: "Ricinus communis",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Ricin toxin B-chain; galactose-binding lectin",
  },
  {
    accession: "P11140",
    geneName: "Abrin-a A-chain",
    organism: "Abrus precatorius",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Abrin toxin A-chain; ribosome-inactivating protein",
  },
  {
    accession: "P93543",
    geneName: "Abrin-a B-chain",
    organism: "Abrus precatorius",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Abrin toxin B-chain; galactose-binding lectin",
  },
  {
    accession: "P10845",
    geneName: "BoNT/A",
    organism: "Clostridium botulinum",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Botulinum neurotoxin type A",
  },
  {
    accession: "P10844",
    geneName: "BoNT/B",
    organism: "Clostridium botulinum",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Botulinum neurotoxin type B",
  },
  {
    accession: "P26710",
    geneName: "BoNT/C",
    organism: "Clostridium botulinum",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Botulinum neurotoxin type C1",
  },
  {
    accession: "P19321",
    geneName: "BoNT/D",
    organism: "Clostridium botulinum",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Botulinum neurotoxin type D",
  },
  {
    accession: "Q00496",
    geneName: "BoNT/E",
    organism: "Clostridium botulinum",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Botulinum neurotoxin type E",
  },
  {
    accession: "P30996",
    geneName: "BoNT/F",
    organism: "Clostridium botulinum",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Botulinum neurotoxin type F",
  },
  {
    accession: "P0DPI1",
    geneName: "SEB",
    organism: "Staphylococcus aureus",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Staphylococcal enterotoxin B",
  },
  {
    accession: "P01552",
    geneName: "SEA",
    organism: "Staphylococcus aureus",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Staphylococcal enterotoxin A",
  },
  {
    accession: "Q7BEC4",
    geneName: "Epsilon toxin",
    organism: "Clostridium perfringens",
    category: "toxin",
    regulatoryList: "HHS",
    description: "Clostridium perfringens epsilon toxin",
  },

  // ── Select Agent Pathogen Virulence Genes ────────────────────────────
  {
    accession: "P13423",
    geneName: "pagA (Protective Antigen)",
    organism: "Bacillus anthracis",
    category: "select_agent",
    regulatoryList: "Overlap",
    description: "Anthrax protective antigen; component of lethal toxin and edema toxin",
  },
  {
    accession: "P15917",
    geneName: "lef (Lethal Factor)",
    organism: "Bacillus anthracis",
    category: "select_agent",
    regulatoryList: "Overlap",
    description: "Anthrax lethal factor; zinc metalloprotease",
  },
  {
    accession: "P23004",
    geneName: "cya (Edema Factor)",
    organism: "Bacillus anthracis",
    category: "select_agent",
    regulatoryList: "Overlap",
    description: "Anthrax edema factor; calmodulin-dependent adenylate cyclase",
  },
  {
    accession: "Q56991",
    geneName: "pla (Plasminogen activator)",
    organism: "Yersinia pestis",
    category: "select_agent",
    regulatoryList: "HHS",
    description: "Plague plasminogen activator protease; key virulence factor",
  },
  {
    accession: "P26948",
    geneName: "caf1 (F1 capsule antigen)",
    organism: "Yersinia pestis",
    category: "select_agent",
    regulatoryList: "HHS",
    description: "Plague F1 capsular antigen; anti-phagocytic",
  },
  {
    accession: "P0C7X7",
    geneName: "lcrV (V antigen)",
    organism: "Yersinia pestis",
    category: "select_agent",
    regulatoryList: "HHS",
    description: "Plague V antigen; type III secretion and immune evasion",
  },
  {
    accession: "Q05127",
    geneName: "GP (Glycoprotein)",
    organism: "Zaire ebolavirus",
    category: "select_agent",
    regulatoryList: "HHS",
    description: "Ebola surface glycoprotein; mediates cell entry",
  },
  {
    accession: "Q05322",
    geneName: "VP24",
    organism: "Zaire ebolavirus",
    category: "select_agent",
    regulatoryList: "HHS",
    description: "Ebola VP24; interferon antagonist",
  },
  {
    accession: "Q05318",
    geneName: "VP35",
    organism: "Zaire ebolavirus",
    category: "select_agent",
    regulatoryList: "HHS",
    description: "Ebola VP35; interferon inhibitor and polymerase cofactor",
  },
  {
    accession: "P15936",
    geneName: "iglC",
    organism: "Francisella tularensis",
    category: "select_agent",
    regulatoryList: "HHS",
    description: "Tularemia intracellular growth locus protein C; essential for virulence",
  },
  {
    accession: "P0A0L6",
    geneName: "Variola CrmB",
    organism: "Variola major",
    category: "select_agent",
    regulatoryList: "HHS",
    description: "Smallpox cytokine response modifier B; TNF-binding protein",
  },

  // ── Dual-Use: Antibiotic Resistance ──────────────────────────────────
  {
    accession: "P62593",
    geneName: "TEM-1 beta-lactamase",
    organism: "Escherichia coli",
    category: "dual_use",
    regulatoryList: "None",
    description: "TEM-1 beta-lactamase; ampicillin resistance",
  },
  {
    accession: "P0AD65",
    geneName: "SHV-1 beta-lactamase",
    organism: "Klebsiella pneumoniae",
    category: "dual_use",
    regulatoryList: "None",
    description: "SHV-1 beta-lactamase; broad-spectrum beta-lactam resistance",
  },
  {
    accession: "Q9EXU3",
    geneName: "CTX-M-15",
    organism: "Escherichia coli",
    category: "dual_use",
    regulatoryList: "None",
    description: "CTX-M-15 extended-spectrum beta-lactamase; cephalosporin resistance",
  },
  {
    accession: "Q6PT48",
    geneName: "KPC-2",
    organism: "Klebsiella pneumoniae",
    category: "dual_use",
    regulatoryList: "None",
    description: "KPC-2 carbapenemase; carbapenem resistance",
  },
  {
    accession: "Q3HUY0",
    geneName: "NDM-1",
    organism: "Klebsiella pneumoniae",
    category: "dual_use",
    regulatoryList: "None",
    description: "NDM-1 metallo-beta-lactamase; carbapenem resistance",
  },
  {
    accession: "Q51578",
    geneName: "VIM-1",
    organism: "Pseudomonas aeruginosa",
    category: "dual_use",
    regulatoryList: "None",
    description: "VIM-1 metallo-beta-lactamase; carbapenem resistance",
  },
  {
    accession: "Q8GKP8",
    geneName: "OXA-48",
    organism: "Klebsiella pneumoniae",
    category: "dual_use",
    regulatoryList: "None",
    description: "OXA-48 carbapenemase; carbapenem resistance",
  },
  {
    accession: "A0A0R6L508",
    geneName: "MCR-1",
    organism: "Escherichia coli",
    category: "dual_use",
    regulatoryList: "None",
    description: "MCR-1 phosphoethanolamine transferase; colistin resistance (last-resort antibiotic)",
  },
  {
    accession: "P07445",
    geneName: "VanA",
    organism: "Enterococcus faecium",
    category: "dual_use",
    regulatoryList: "None",
    description: "VanA ligase; vancomycin resistance",
  },
  {
    accession: "P37059",
    geneName: "VanB",
    organism: "Enterococcus faecalis",
    category: "dual_use",
    regulatoryList: "None",
    description: "VanB ligase; vancomycin resistance",
  },
  {
    accession: "Q83BA0",
    geneName: "mecA",
    organism: "Staphylococcus aureus",
    category: "dual_use",
    regulatoryList: "None",
    description: "PBP2a; methicillin/oxacillin resistance (MRSA)",
  },

  // ── Dual-Use: Gain-of-Function Markers ───────────────────────────────
  {
    accession: "P31345",
    geneName: "PB2 (polymerase basic protein 2)",
    organism: "Influenza A virus",
    category: "gain_of_function",
    regulatoryList: "None",
    description: "Influenza PB2; E627K and D701N mutations confer mammalian adaptation",
  },
  {
    accession: "P03437",
    geneName: "HA (Hemagglutinin, H5N1)",
    organism: "Influenza A virus (H5N1)",
    category: "gain_of_function",
    regulatoryList: "None",
    description: "Influenza H5 hemagglutinin; polybasic cleavage site associated with high pathogenicity",
  },
];

// Build a lookup map for fast accession matching
const catalogMap = new Map<string, ThreatEntry>();
for (const entry of threatCatalog) {
  catalogMap.set(entry.accession.toUpperCase(), entry);
}

export function lookupAccession(accession: string): ThreatEntry | undefined {
  return catalogMap.get(accession.toUpperCase());
}

export function searchCatalogByKeywords(text: string): ThreatEntry[] {
  const lower = text.toLowerCase();
  return threatCatalog.filter(
    (e) =>
      lower.includes(e.geneName.toLowerCase()) ||
      lower.includes(e.organism.toLowerCase())
  );
}
