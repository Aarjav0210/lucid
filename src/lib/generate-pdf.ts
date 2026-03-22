import jsPDF from "jspdf";
import type { SequenceReport, DomainReport, IntegratedReport } from "./report-types";

const MARGIN = 20;
const PAGE_WIDTH = 210; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 5;

function checkPage(doc: jsPDF, y: number, needed: number = 20): number {
  if (y + needed > 280) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function sectionHeader(doc: jsPDF, y: number, text: string): number {
  y = checkPage(doc, y, 15);
  doc.setFillColor(18, 18, 18);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), MARGIN + 3, y + 5.5);
  doc.setTextColor(18, 18, 18);
  return y + 12;
}

function label(doc: jsPDF, y: number, key: string, value: string): number {
  y = checkPage(doc, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(key, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(value, MARGIN + 35, y);
  return y + LINE_HEIGHT;
}

function riskColor(level: string): [number, number, number] {
  switch (level) {
    case "HIGH": return [220, 38, 38];
    case "MEDIUM": return [234, 179, 8];
    case "LOW": return [5, 150, 105];
    default: return [120, 120, 120];
  }
}

function riskBadge(doc: jsPDF, x: number, y: number, level: string) {
  const [r, g, b] = riskColor(level);
  doc.setFillColor(r, g, b);
  const textColor: [number, number, number] = level === "MEDIUM" ? [18, 18, 18] : [255, 255, 255];
  const w = doc.getTextWidth(level + " RISK") + 6;
  doc.roundedRect(x, y - 3.5, w, 5, 1, 1, "F");
  doc.setTextColor(...textColor);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(level + " RISK", x + 3, y);
  doc.setTextColor(18, 18, 18);
}

function wrappedText(doc: jsPDF, y: number, text: string, fontSize: number = 8): number {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  for (const line of lines) {
    y = checkPage(doc, y);
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT;
  }
  return y;
}

function renderDomain(doc: jsPDF, y: number, domain: DomainReport, index: number): number {
  y = checkPage(doc, y, 25);

  // Domain header bar
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "F");
  doc.setDrawColor(18, 18, 18);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Domain ${index + 1}: ${domain.domain.annotation}  (${domain.domain.start}–${domain.domain.end}, ${domain.domain.sequence.length} AA)`,
    MARGIN + 3,
    y + 4.5
  );

  if (domain.summary) {
    riskBadge(doc, MARGIN + CONTENT_WIDTH - 30, y + 4.5, domain.summary.riskLevel);
  }
  y += 11;

  // Diamond results
  if (domain.diamond) {
    y = checkPage(doc, y, 10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("DIAMOND ALIGNMENT", MARGIN + 2, y);
    doc.setTextColor(18, 18, 18);
    y += 4;

    if (domain.diamond.hits.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("No hits against threat database.", MARGIN + 2, y);
      y += LINE_HEIGHT;
    } else {
      for (const hit of domain.diamond.hits.slice(0, 3)) {
        y = checkPage(doc, y, 12);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(hit.title, MARGIN + 2, y);
        y += LINE_HEIGHT;
        doc.setFont("helvetica", "normal");
        doc.text(
          `Identity: ${hit.identity.toFixed(1)}%  |  Coverage: ${hit.coverage.toFixed(1)}%  |  E-value: ${hit.evalue.toExponential(1)}`,
          MARGIN + 2,
          y
        );
        y += LINE_HEIGHT;
        if (hit.threatFlags.length > 0) {
          doc.setFont("helvetica", "bold");
          const [r, g, b] = riskColor("HIGH");
          doc.setTextColor(r, g, b);
          doc.text(`Threat flags: ${hit.threatFlags.join(", ")}`, MARGIN + 2, y);
          doc.setTextColor(18, 18, 18);
          y += LINE_HEIGHT;
        }
      }
    }
    y += 2;
  }

  // ESMFold results
  if (domain.structure) {
    y = checkPage(doc, y, 10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("ESMFOLD STRUCTURE PREDICTION", MARGIN + 2, y);
    doc.setTextColor(18, 18, 18);
    y += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Mean pLDDT: ${domain.structure.plddtMean.toFixed(1)}  |  Confidence: ${domain.structure.confidenceCategory}`,
      MARGIN + 2,
      y
    );
    y += LINE_HEIGHT + 2;
  }

  // Foldseek results
  if (domain.foldseek) {
    y = checkPage(doc, y, 10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("FOLDSEEK STRUCTURAL SEARCH", MARGIN + 2, y);
    doc.setTextColor(18, 18, 18);
    y += 4;

    if (domain.foldseek.hits.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("No structural homologs found.", MARGIN + 2, y);
      y += LINE_HEIGHT;
    } else {
      for (const hit of domain.foldseek.hits.slice(0, 3)) {
        y = checkPage(doc, y, 10);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(hit.proteinName, MARGIN + 2, y);
        doc.setFont("helvetica", "normal");
        y += LINE_HEIGHT;
        doc.text(
          `Organism: ${hit.organism}  |  P=${hit.probability.toFixed(2)}  |  E=${hit.evalue.toExponential(1)}`,
          MARGIN + 2,
          y
        );
        y += LINE_HEIGHT;
        if (hit.flagged && hit.riskKeywords.length > 0) {
          doc.setFont("helvetica", "bold");
          const [r, g, b] = riskColor("HIGH");
          doc.setTextColor(r, g, b);
          doc.text(`Risk keywords: ${hit.riskKeywords.join(", ")}`, MARGIN + 2, y);
          doc.setTextColor(18, 18, 18);
          y += LINE_HEIGHT;
        }
      }
    }
    y += 2;
  }

  // Domain summary
  if (domain.summary) {
    y = checkPage(doc, y, 15);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("DOMAIN ASSESSMENT", MARGIN + 2, y);
    doc.setTextColor(18, 18, 18);
    y += 5;

    y = label(doc, y, "Risk Level:", `${domain.summary.riskLevel} (${(domain.summary.confidence * 100).toFixed(0)}% confidence)`);
    y = wrappedText(doc, y, domain.summary.reasoning);

    if (domain.summary.flags.length > 0) {
      y = checkPage(doc, y);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`Flags: ${domain.summary.flags.join(", ")}`, MARGIN + 2, y);
      y += LINE_HEIGHT;
    }
  }

  // Separator line
  y += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 5;

  return y;
}

function renderIntegratedReport(doc: jsPDF, y: number, report: IntegratedReport): number {
  y = sectionHeader(doc, y, "Integrated Risk Assessment");

  // Overall risk badge
  riskBadge(doc, MARGIN, y, report.overallRisk);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Confidence: ${(report.confidence * 100).toFixed(0)}%`, MARGIN + 35, y);
  y += 8;

  // Decision
  y = checkPage(doc, y, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Decision: ${report.decision}`, MARGIN, y);
  y += 7;

  // Architecture
  y = checkPage(doc, y, 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("DOMAIN ARCHITECTURE", MARGIN, y);
  doc.setTextColor(18, 18, 18);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("courier", "bold");
  const archLines = doc.splitTextToSize(report.architectureSummary, CONTENT_WIDTH);
  for (const line of archLines) {
    y = checkPage(doc, y);
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT;
  }
  doc.setFont("helvetica", "normal");
  y += 3;

  // Reasoning
  y = checkPage(doc, y, 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("REASONING", MARGIN, y);
  doc.setTextColor(18, 18, 18);
  y += 5;
  y = wrappedText(doc, y, report.reasoning);
  y += 3;

  // Synergistic factors
  if (report.synergisticFactors.length > 0) {
    y = checkPage(doc, y, 15);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("SYNERGISTIC RISK FACTORS", MARGIN, y);
    doc.setTextColor(18, 18, 18);
    y += 5;

    for (const factor of report.synergisticFactors) {
      y = checkPage(doc, y, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`[${factor.riskContribution}] ${factor.domains.join(" + ")}`, MARGIN + 2, y);
      y += LINE_HEIGHT;
      doc.setFont("helvetica", "normal");
      y = wrappedText(doc, y, factor.concern);
      y += 2;
    }
  }

  // Flags
  if (report.flags.length > 0) {
    y = checkPage(doc, y, 10);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`Flags: ${report.flags.join(", ")}`, MARGIN, y);
    y += LINE_HEIGHT;
  }

  return y;
}

export function generateScreeningPDF(report: SequenceReport): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // ── Title ──
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Biosecurity Screening Report", MARGIN, y);
  y += 8;

  // Report ID and date
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Report ID: ${report.id}`, MARGIN, y);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    MARGIN + 60,
    y
  );
  doc.setTextColor(18, 18, 18);
  y += 4;

  // Divider
  doc.setDrawColor(18, 18, 18);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 8;

  // ── Sequence Overview ──
  y = sectionHeader(doc, y, "Sequence Overview");
  y = label(doc, y, "Sequence Length:", `${report.sequenceLength} amino acids`);
  y = label(doc, y, "Domains Found:", `${report.domains.length}`);
  y = label(doc, y, "Status:", report.status);
  if (report.startedAt) {
    y = label(doc, y, "Started:", new Date(report.startedAt).toLocaleString());
  }
  if (report.completedAt) {
    y = label(doc, y, "Completed:", new Date(report.completedAt).toLocaleString());
  }
  y += 5;

  // ── Per-Domain Analysis ──
  y = sectionHeader(doc, y, "Per-Domain Analysis");
  for (let i = 0; i < report.domains.length; i++) {
    y = renderDomain(doc, y, report.domains[i], i);
  }

  // ── Integrated Report ──
  if (report.integratedReport) {
    y = renderIntegratedReport(doc, y, report.integratedReport);
  }

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`Lucid Biosecurity  |  ${report.id}  |  Page ${i} of ${pageCount}`, MARGIN, 290);
  }

  doc.save(`${report.id}-screening-report.pdf`);
}
