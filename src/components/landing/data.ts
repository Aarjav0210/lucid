/* ─────────────────────────────────────────────────────────────
 * Static content for the landing page.
 * Editing copy / reordering items shouldn't require touching JSX.
 * ───────────────────────────────────────────────────────────── */

export type ProductStatus = "live" | "soon" | "exploring";

export interface Product {
  /** Stable id used for analytics / keys. */
  id: string;
  status: ProductStatus;
  name: string;
  tagline: string;
  description: string;
  /** When set, the product is clickable and routed to this href. */
  href?: string;
  /** Override for the right-hand call-to-action label. */
  launchLabel?: string;
}

export interface ProductGroup {
  id: string;
  /** Numeric prefix shown in the eyebrow tag, e.g. "01". */
  number: string;
  /** Eyebrow label, e.g. "For synthesis". */
  label: string;
  /** Title with optional <em> emphasis (rendered as italic serif). */
  titlePrefix: string;
  titleEmphasis: string;
  titleSuffix: string;
  note: string;
  /** Soften this group visually (lower opacity, hover to focus). */
  dim?: boolean;
  products: Product[];
}

export const productGroups: ProductGroup[] = [
  {
    id: "operational",
    number: "01",
    label: "For synthesis",
    titlePrefix: "The ",
    titleEmphasis: "operational",
    titleSuffix: " stack.",
    note:
      "Embedded screening, vetting, and modeling tools that sit inside the synthesis workflow.",
    products: [
      {
        id: "screening",
        status: "live",
        name: "Sequence Screening",
        tagline: "Multi-approach biosecurity analysis",
        description:
          "Multi-layered screening that catches harmful sequences standard BLAST-based analysis misses — combining sequence, structural, and functional signals.",
        href: "/screening",
        launchLabel: "Launch",
      },
      {
        id: "kyc",
        status: "soon",
        name: "Automated KYC Audits",
        tagline: "Know your customer, instantly",
        description:
          "Compliance checks for biological material orders. Flag high-risk actors before synthesis begins.",
      },
      {
        id: "virtual-cell",
        status: "soon",
        name: "Virtual Cell World Models",
        tagline: "Test novel pathogens, safely",
        description:
          "High-fidelity in silico environments to model novel pathogen behavior before any wet-lab work begins.",
      },
    ],
  },
  {
    id: "ecosystem",
    number: "02",
    label: "For policy",
    titlePrefix: "The ",
    titleEmphasis: "ecosystem",
    titleSuffix: " stack.",
    note:
      "Tools for governments, public-health agencies, and response teams — supporting the wider biosecurity perimeter beyond the synthesis floor.",
    dim: true,
    products: [
      {
        id: "protocol-sims",
        status: "exploring",
        name: "Protocol Preparedness Sims",
        tagline: "Hyper-realistic response training",
        description:
          "Full-fidelity outbreak scenario simulations to train teams and stress-test containment protocols.",
      },
      {
        id: "outbreak-tracker",
        status: "exploring",
        name: "Pathogen Outbreak Tracker",
        tagline: "Real-time global surveillance",
        description:
          "Live monitoring of pathogen outbreak signals across global health networks, flagging biosecurity-relevant events as they emerge.",
      },
    ],
  },
];

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  /** "up" places the entry above the centerline, "down" below. */
  position: "up" | "down";
  /** Highlights the marker as the present moment. */
  current?: boolean;
}

export const timelineEvents: TimelineEvent[] = [
  {
    year: "1975",
    title: "Asilomar",
    description:
      "Scientists self-pause recombinant DNA work to write the first safety norms.",
    position: "down",
  },
  {
    year: "2001",
    title: "Anthrax letters",
    description:
      "A weaponized pathogen mailed inside the U.S. resets biosecurity policy.",
    position: "up",
  },
  {
    year: "2011",
    title: "H5N1 dual-use",
    description:
      "Gain-of-function research forces a global debate on what to publish.",
    position: "down",
  },
  {
    year: "2018",
    title: "IGSC protocol",
    description:
      "Synthesis providers harmonize on a voluntary screening standard.",
    position: "up",
  },
  {
    year: "2020",
    title: "mRNA at scale",
    description:
      "A pandemic proves synthetic biology can deploy globally in months.",
    position: "down",
  },
  {
    year: "2023",
    title: "Generative biology",
    description:
      "AI-designed proteins and LLMs raise the ceiling, and the risk surface.",
    position: "up",
  },
  {
    year: "2025",
    title: "EU Biotech Act",
    description:
      "Europe codifies biosecurity expectations across the biotech value chain.",
    position: "down",
  },
  {
    year: "2025",
    title: "Paraphrase Project",
    description:
      "Microsoft shows how AI-paraphrased sequences slip past existing screens.",
    position: "up",
  },
  {
    year: "2026",
    title: "BMI Act proposals",
    description:
      "U.S. Biosecurity Modernization & Innovation Act enters legislative debate.",
    position: "down",
  },
  {
    year: "2026",
    title: "Lucid",
    description:
      "A complete security layer for biosynthesis, built for what comes next.",
    position: "up",
    current: true,
  },
];

export interface Affiliation {
  name: string;
  location: string;
}

export const affiliations: Affiliation[] = [
  { name: "Brown University", location: "Providence, RI" },
  { name: "Univ. of Pennsylvania", location: "Philadelphia, PA" },
  { name: "Yale University", location: "New Haven, CT" },
  { name: "King's College London", location: "London, UK" },
];

export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: "Mission", href: "#mission" },
  { label: "Stacks", href: "#stacks" },
  { label: "Team", href: "#team" },
  { label: "Contact", href: "#contact" },
];

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export const footerColumns: FooterColumn[] = [
  {
    heading: "Products",
    links: [
      { label: "Sequence Screening", href: "/screening" },
      { label: "KYC Audits", href: "#stack-operational" },
      { label: "Virtual Cell", href: "#stack-operational" },
      { label: "Preparedness Sims", href: "#stack-ecosystem" },
      { label: "Outbreak Tracker", href: "#stack-ecosystem" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Mission", href: "#mission" },
      { label: "Research", href: "#mission" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "aarjav02@gmail.com", href: "mailto:aarjav02@gmail.com" },
    ],
  },
];

/** Threats rendered on the ambient radar in the hero. */
export interface RadarThreat {
  id: "t1" | "t2" | "t3" | "t4";
  label: string;
  /** Position of the threat marker in SVG coordinates (viewBox 0 0 360 360). */
  cx: number;
  cy: number;
  /** Position of the hover label text. */
  labelX: number;
  labelY: number;
}

export const radarThreats: RadarThreat[] = [
  { id: "t1", label: "BSL-4 · WUXI", cx: 248, cy: 118, labelX: 258, labelY: 114 },
  { id: "t2", label: "SYNTH · BOSTON", cx: 272, cy: 230, labelX: 282, labelY: 234 },
  { id: "t3", label: "ANOMALY · SÃO PAULO", cx: 118, cy: 246, labelX: 32, labelY: 262 },
  { id: "t4", label: "ORDER · BERLIN", cx: 96, cy: 110, labelX: 24, labelY: 100 },
];
