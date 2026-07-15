import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_PATH = path.join(__dirname, '../assets/aitpune.jpg');

// Page geometry (A4 at 72 dpi)
const PW = 595.28;
const PH = 841.89;
const ML = 40;   // left margin
const MR = 40;   // right margin
const CW = PW - ML - MR; // 515.28 — content width
const CX = PW - MR;       // right content edge

// Summary table columns — widths must sum to CW (515)
const COLS = [
  { w: 28,  label: 'Sr.' },
  { w: 95,  label: 'Club' },
  { w: 160, label: 'Event Name' },
  { w: 70,  label: 'Date' },
  { w: 60,  label: 'Time' },
  { w: 102, label: 'Venue' },
];

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDay(d) {
  if (!d) return '—';
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d).getDay()];
}

function academicYear(date = new Date()) {
  const yr = date.getFullYear();
  const mon = date.getMonth(); // 0-indexed, June=5
  return mon >= 6 ? `${yr}-${yr + 1}` : `${yr - 1}-${yr}`;
}

// ── Header (drawn once per page) ──────────────────────────────────────────────

function drawHeader(doc) {
  const y0 = 28;

  // AIT logo — top left
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, ML, y0, { width: 62, height: 62 });
  }

  // Centered title block — offset right of logo
  const tx = ML + 68;
  const tw = CW - 68;

  doc
    .font('Helvetica-Bold').fontSize(13).fillColor('#003087')
    .text('ARMY INSTITUTE OF TECHNOLOGY PUNE', tx, y0 + 2, { width: tw, align: 'center' });

  doc
    .font('Helvetica').fontSize(8.5).fillColor('#111')
    .text('Autonomous Institute, Affiliated to Savitribai Phule Pune University', tx, y0 + 20, { width: tw, align: 'center' });

  doc
    .font('Helvetica-Bold').fontSize(10.5).fillColor('#111')
    .text('CLUB EVENTS REPORT', tx, y0 + 35, { width: tw, align: 'center' });

  const now = new Date();
  doc
    .font('Helvetica').fontSize(8.5).fillColor('#111')
    .text(`Academic Year: ${academicYear(now)}`, tx, y0 + 50, { width: tw, align: 'center' });

  // Date — top right corner
  doc
    .font('Helvetica').fontSize(8).fillColor('#444')
    .text(`Date: ${fmtDate(now)}`, PW - MR - 95, y0 + 50, { width: 90, align: 'right' });

  // Thick divider below header
  const lineY = y0 + 71;
  doc.moveTo(ML, lineY).lineTo(CX, lineY).lineWidth(1.5).stroke('#000');

  return lineY + 10; // y after header
}

// ── Page initialiser (border + header) ────────────────────────────────────────

function initPage(doc) {
  doc.rect(15, 15, PW - 30, PH - 30).lineWidth(0.8).stroke('#000');
  return drawHeader(doc);
}

// ── Table row ─────────────────────────────────────────────────────────────────

function drawTableRow(doc, y, values, isHeader) {
  const ROW_H = 20;
  const totalW = COLS.reduce((s, c) => s + c.w, 0);

  if (isHeader) {
    doc.rect(ML, y, totalW, ROW_H).fillAndStroke('#cce0f0', '#333');
  } else {
    doc.rect(ML, y, totalW, ROW_H).stroke('#333');
  }

  let x = ML;
  COLS.forEach((col, i) => {
    // Vertical column divider (skip leftmost edge — outer rect covers it)
    if (i > 0) {
      doc.moveTo(x, y).lineTo(x, y + ROW_H).lineWidth(0.5).stroke('#333');
    }

    doc
      .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(8)
      .fillColor('#000')
      .text(String(values[i] ?? '—'), x + 3, y + 6, {
        width: col.w - 6,
        height: ROW_H - 6,
        lineBreak: false,
        ellipsis: true,
      });

    x += col.w;
  });

  return y + ROW_H;
}

// ── Public entry point ────────────────────────────────────────────────────────

export function generateEventReport(stream, events) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
  doc.pipe(stream);

  let y = initPage(doc);

  // ── SECTION 1: Summary table ──────────────────────────────────────────────

  y += 4;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000')
    .text('CLUB EVENTS — SUMMARY TABLE', ML, y, { width: CW, align: 'center' });
  y += 18;

  // Header row
  y = drawTableRow(doc, y, COLS.map(c => c.label), true);

  // Data rows
  events.forEach((ev, i) => {
    if (y > 790) {
      doc.addPage({ size: 'A4', margin: 0 });
      y = initPage(doc);
      y += 4;
      y = drawTableRow(doc, y, COLS.map(c => c.label), true);
    }
    y = drawTableRow(doc, y, [
      i + 1,
      ev.club || '—',
      ev.eventName || '—',
      fmtDate(ev.date),
      ev.time || '—',
      ev.venue || '—',
    ], false);
  });

  // ── SECTION 2: Event details ──────────────────────────────────────────────

  y += 18;
  if (y > 730) {
    doc.addPage({ size: 'A4', margin: 0 });
    y = initPage(doc);
    y += 8;
  }

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000')
    .text('EVENT DETAILS  (MOST RECENT FIRST)', ML, y, { width: CW, align: 'center' });
  y += 6;
  doc.moveTo(ML, y).lineTo(CX, y).lineWidth(1).stroke('#000');
  y += 10;

  events.forEach((ev, i) => {
    // Rough height: name line + meta line + description + gap
    const descLines = ev.description ? Math.ceil(ev.description.length / 90) : 0;
    const blockHeight = 14 + 12 + descLines * 10 + 14;

    if (y + blockHeight > 800) {
      doc.addPage({ size: 'A4', margin: 0 });
      y = initPage(doc);
      y += 8;
    }

    // Event name
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#003087')
      .text(`${i + 1}.  ${ev.eventName || 'Untitled Event'}`, ML, y, { width: CW });
    y = doc.y + 2;

    // Meta: club | day, date | time | venue
    const metaParts = [
      ev.club,
      ev.date ? `${fmtDay(ev.date)}, ${fmtDate(ev.date)}` : null,
      ev.time,
      ev.venue,
    ].filter(Boolean);
    doc.font('Helvetica').fontSize(8).fillColor('#555')
      .text(metaParts.join('  |  '), ML, y, { width: CW });
    y = doc.y + 4;

    if (ev.description) {
      doc.font('Helvetica').fontSize(8.5).fillColor('#222')
        .text(ev.description, ML + 10, y, { width: CW - 10 });
      y = doc.y + 4;
    }

    // Light rule between events
    doc.moveTo(ML, y + 2).lineTo(CX, y + 2).lineWidth(0.3).stroke('#aaa');
    y += 10;
  });

  // ── Page numbers (buffered pages allow backward access) ───────────────────

  const { start, count } = doc.bufferedPageRange();
  for (let i = 0; i < count; i++) {
    doc.switchToPage(start + i);
    doc.font('Helvetica').fontSize(8).fillColor('#444')
      .text(`Page ${i + 1} of ${count}`, ML, PH - 28, { width: CW, align: 'center' });
  }

  doc.end();
}
