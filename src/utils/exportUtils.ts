import { jsPDF } from 'jspdf';
import { StudyDeck, Flashcard } from '../types/study';

// Safe filename helper
export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50);
}

// Format flashcard field for CSV with RFC 4180 escaping
function escapeCSVField(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '""';
  const str = String(field);
  // If the field contains comma, quote, or newline, escape quotes and wrap in quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export interface CSVExportOptions {
  format?: 'standard' | 'anki' | 'quizlet';
  includeHeaders?: boolean;
}

/**
 * Generates and downloads a CSV file from flashcards in a deck.
 */
export function exportDeckToCSV(deck: StudyDeck, options: CSVExportOptions = {}): void {
  const { format = 'standard', includeHeaders = true } = options;

  let content = '';

  if (format === 'anki' || format === 'quizlet') {
    // 2-column Term / Definition format (compatible with Anki & Quizlet import)
    const rows = deck.flashcards.map((card) => {
      const term = escapeCSVField(card.front);
      const def = escapeCSVField(card.back + (card.hint ? ` (Hint: ${card.hint})` : ''));
      return `${term},${def}`;
    });

    if (includeHeaders) {
      content = 'Front,Back\n' + rows.join('\n');
    } else {
      content = rows.join('\n');
    }
  } else {
    // Standard full CSV with metadata
    const headers = ['Front / Question', 'Back / Answer', 'Category', 'Hint', 'Mastery Status', 'Review Count'];
    const rows = deck.flashcards.map((card) => {
      return [
        escapeCSVField(card.front),
        escapeCSVField(card.back),
        escapeCSVField(card.category || deck.topic),
        escapeCSVField(card.hint || ''),
        escapeCSVField(card.masteryStatus || 'new'),
        escapeCSVField(card.reviewCount || 0),
      ].join(',');
    });

    content = (includeHeaders ? headers.join(',') + '\n' : '') + rows.join('\n');
  }

  // Add UTF-8 BOM so Microsoft Excel and Apple Numbers open with proper characters
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const filename = `${sanitizeFileName(deck.title)}_flashcards_${format}.csv`;

  anchor.href = url;
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export interface PDFExportOptions {
  layout?: 'sheet' | 'cutout'; // 'sheet' = tabular study sheet, 'cutout' = fold/cut flashcards
  includeHints?: boolean;
  includeCategory?: boolean;
  cardsPerPage?: number;
}

/**
 * Generates and downloads a printable PDF using jsPDF.
 */
export function exportDeckToPDF(deck: StudyDeck, options: PDFExportOptions = {}): void {
  const { layout = 'sheet', includeHints = true, includeCategory = true } = options;

  // Initialize jsPDF (A4 portrait: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;
  let pageNumber = 1;

  // Helper to add top header banner on page
  const renderHeader = (isFirstPage: boolean) => {
    // Subtle top accent line
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(margin, currentY, contentWidth, 2.5, 'F');
    currentY += 5;

    if (isFirstPage) {
      // Main Deck Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(deck.title, margin, currentY + 3);
      currentY += 8;

      // Meta row: Topic, Difficulty, Card Count, Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      const dateStr = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const metaText = `Subject: ${deck.topic}  •  Difficulty: ${deck.difficulty.toUpperCase()}  •  ${deck.flashcards.length} Flashcards  •  Exported on ${dateStr}`;
      doc.text(metaText, margin, currentY);
      currentY += 6;

      // Thin separator
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.4);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 6;
    } else {
      // Compact page header on subsequent pages
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${deck.title} — StudyPulse Flashcards`, margin, currentY + 2);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY + 4, pageWidth - margin, currentY + 4);
      currentY += 7;
    }
  };

  // Helper to add footer
  const renderFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    const footerText = `StudyPulse • Offline Study Deck • Page ${pageNumber}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });
  };

  // -------------------------------------------------------------
  // Layout 1: Study Reference Sheet (Tabular Cheat Sheet)
  // -------------------------------------------------------------
  if (layout === 'sheet') {
    renderHeader(true);

    const col1Width = contentWidth * 0.44; // Front col
    const col2Width = contentWidth * 0.56; // Back col
    const col1X = margin;
    const col2X = margin + col1Width;

    // Table Header
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('QUESTION / PROMPT', col1X + 3, currentY + 4.8);
    doc.text('ANSWER / KEY CONCEPT', col2X + 3, currentY + 4.8);
    currentY += 7;

    deck.flashcards.forEach((card, index) => {
      // Calculate heights
      const frontLines = doc.splitTextToSize(card.front, col1Width - 8);
      const backLines = doc.splitTextToSize(card.back, col2Width - 8);

      let cardHeight = Math.max(frontLines.length * 4.2 + 6, backLines.length * 4.2 + 6);
      if (includeCategory && card.category) cardHeight += 4;
      if (includeHints && card.hint) cardHeight += 4;

      cardHeight = Math.max(cardHeight, 14);

      // Check page break
      if (currentY + cardHeight > pageHeight - 16) {
        renderFooter();
        doc.addPage();
        pageNumber++;
        currentY = margin;
        renderHeader(false);

        // Re-render table header on new page
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, contentWidth, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text('QUESTION / PROMPT', col1X + 3, currentY + 4.8);
        doc.text('ANSWER / KEY CONCEPT', col2X + 3, currentY + 4.8);
        currentY += 7;
      }

      // Alternating row background
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.rect(margin, currentY, contentWidth, cardHeight, 'F');
      }

      // Border around cell
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.rect(margin, currentY, contentWidth, cardHeight, 'S');
      doc.line(col2X, currentY, col2X, currentY + cardHeight);

      // Front content
      let frontY = currentY + 4.5;

      // Card number badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(99, 102, 241); // Indigo 500
      doc.text(`#${index + 1}`, col1X + 3, frontY);

      if (includeCategory && card.category) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`[${card.category}]`, col1X + 11, frontY);
      }

      frontY += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(frontLines, col1X + 3, frontY);

      // Back content
      let backY = currentY + 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(backLines, col2X + 3, backY);

      // Optional Hint
      if (includeHints && card.hint) {
        const hintY = currentY + cardHeight - 3;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const hintLines = doc.splitTextToSize(`Hint: ${card.hint}`, col2Width - 6);
        doc.text(hintLines, col2X + 3, hintY);
      }

      currentY += cardHeight;
    });

    renderFooter();
  }

  // -------------------------------------------------------------
  // Layout 2: Cut & Fold Flashcard Index Cards (2 columns, printable)
  // -------------------------------------------------------------
  else {
    renderHeader(true);

    const cardWidth = (contentWidth - 6) / 2; // 2 cards per row
    const cardHeight = 44; // mm
    const cardGapX = 6;
    const cardGapY = 5;

    let col = 0; // 0 or 1

    deck.flashcards.forEach((card, index) => {
      // Check page break before rendering card
      if (currentY + cardHeight > pageHeight - 16) {
        renderFooter();
        doc.addPage();
        pageNumber++;
        currentY = margin;
        renderHeader(false);
        col = 0;
      }

      const cardX = margin + col * (cardWidth + cardGapX);
      const cardY = currentY;

      // Card bounding container (dashed border for scissor cut guidelines)
      doc.setDrawColor(148, 163, 184); // Slate 400
      doc.setLineDashPattern([2, 2], 0);
      doc.setLineWidth(0.35);
      doc.rect(cardX, cardY, cardWidth, cardHeight, 'S');
      doc.setLineDashPattern([], 0); // reset dash

      // Card top bar
      doc.setFillColor(241, 245, 249);
      doc.rect(cardX + 0.35, cardY + 0.35, cardWidth - 0.7, 5.5, 'F');

      // Card index & Category
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(79, 70, 229);
      doc.text(`CARD #${index + 1}`, cardX + 2.5, cardY + 4);

      if (includeCategory && card.category) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        const catStr = card.category.slice(0, 18);
        doc.text(catStr, cardX + cardWidth - 2.5, cardY + 4, { align: 'right' });
      }

      // Center fold line guideline
      const foldY = cardY + 22;
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineDashPattern([1, 2], 0);
      doc.line(cardX + 2, foldY, cardX + cardWidth - 2, foldY);
      doc.setLineDashPattern([], 0);

      // FRONT LABEL & TEXT (Upper half of the card)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('FRONT / PROMPT', cardX + 2.5, cardY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const frontLines = doc.splitTextToSize(card.front, cardWidth - 5);
      doc.text(frontLines.slice(0, 3), cardX + 2.5, cardY + 11.5);

      // BACK LABEL & TEXT (Lower half of the card)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('BACK / ANSWER', cardX + 2.5, foldY + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      const backLines = doc.splitTextToSize(card.back, cardWidth - 5);
      doc.text(backLines.slice(0, 3), cardX + 2.5, foldY + 7);

      // Optional Hint at very bottom
      if (includeHints && card.hint) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        const hintStr = `Hint: ${card.hint.slice(0, 35)}`;
        doc.text(hintStr, cardX + 2.5, cardY + cardHeight - 1.8);
      }

      // Advance column / row
      if (col === 0) {
        col = 1;
      } else {
        col = 0;
        currentY += cardHeight + cardGapY;
      }
    });

    renderFooter();
  }

  // Trigger browser download
  const filename = `${sanitizeFileName(deck.title)}_flashcards_${layout}.pdf`;
  doc.save(filename);
}

/**
 * Opens a dedicated printable view in an iframe or print window
 * for high-definition browser printing with customized paper formatting.
 */
export function printFlashcardsDocument(deck: StudyDeck, options: PDFExportOptions = {}): void {
  const { layout = 'sheet', includeHints = true, includeCategory = true } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the print preview.');
    return;
  }

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const cardsHtml =
    layout === 'sheet'
      ? `
      <table class="table-sheet">
        <thead>
          <tr>
            <th style="width: 8%;">#</th>
            <th style="width: 42%;">Prompt / Concept (Front)</th>
            <th style="width: 50%;">Answer / Explanation (Back)</th>
          </tr>
        </thead>
        <tbody>
          ${deck.flashcards
            .map(
              (card, idx) => `
            <tr>
              <td class="num-cell">${idx + 1}</td>
              <td>
                <div class="card-front">${escapeHtml(card.front)}</div>
                ${includeCategory && card.category ? `<div class="card-cat">${escapeHtml(card.category)}</div>` : ''}
              </td>
              <td>
                <div class="card-back">${escapeHtml(card.back)}</div>
                ${includeHints && card.hint ? `<div class="card-hint"><strong>Hint:</strong> ${escapeHtml(card.hint)}</div>` : ''}
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
      : `
      <div class="cards-grid">
        ${deck.flashcards
          .map(
            (card, idx) => `
          <div class="cut-card">
            <div class="card-top">
              <span class="card-num">CARD #${idx + 1}</span>
              ${includeCategory && card.category ? `<span class="card-cat-badge">${escapeHtml(card.category)}</span>` : ''}
            </div>
            <div class="card-half front-half">
              <div class="half-label">FRONT / PROMPT</div>
              <div class="half-content font-front">${escapeHtml(card.front)}</div>
            </div>
            <div class="fold-line">
              <span>✂ FOLD OR CUT HERE</span>
            </div>
            <div class="card-half back-half">
              <div class="half-label">BACK / ANSWER</div>
              <div class="half-content font-back">${escapeHtml(card.back)}</div>
              ${includeHints && card.hint ? `<div class="card-hint-text">💡 ${escapeHtml(card.hint)}</div>` : ''}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(deck.title)} - Printable Flashcards</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 10mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 16px;
          line-height: 1.4;
        }
        .header-bar {
          border-bottom: 2px solid #4f46e5;
          padding-bottom: 8px;
          margin-bottom: 14px;
        }
        .deck-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .deck-meta {
          font-size: 11px;
          color: #64748b;
          display: flex;
          gap: 16px;
        }
        .badge {
          display: inline-block;
          font-weight: 600;
          color: #4f46e5;
        }

        /* Sheet Table */
        .table-sheet {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .table-sheet th {
          background-color: #f1f5f9;
          color: #334155;
          text-align: left;
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .table-sheet td {
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          vertical-align: top;
          page-break-inside: avoid;
        }
        .table-sheet tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .num-cell {
          font-weight: 700;
          color: #4f46e5;
          text-align: center;
        }
        .card-front {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .card-cat {
          font-size: 9px;
          color: #64748b;
          text-transform: uppercase;
        }
        .card-back {
          color: #1e293b;
        }
        .card-hint {
          font-size: 10px;
          color: #64748b;
          margin-top: 4px;
          font-style: italic;
        }

        /* Cut-out Cards Grid */
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .cut-card {
          border: 1px dashed #94a3b8;
          border-radius: 4px;
          padding: 8px 10px;
          page-break-inside: avoid;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 180px;
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 700;
          color: #4f46e5;
          margin-bottom: 6px;
        }
        .card-cat-badge {
          color: #64748b;
          font-weight: 500;
        }
        .card-half {
          flex: 1;
        }
        .half-label {
          font-size: 8px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .half-content {
          font-size: 11px;
          line-height: 1.35;
        }
        .font-front {
          font-weight: 700;
          color: #0f172a;
        }
        .font-back {
          color: #1e293b;
        }
        .fold-line {
          border-top: 1px dashed #cbd5e1;
          margin: 6px 0;
          text-align: center;
          position: relative;
        }
        .fold-line span {
          position: relative;
          top: -6px;
          background: #fff;
          padding: 0 4px;
          font-size: 7px;
          color: #94a3b8;
          letter-spacing: 0.08em;
        }
        .card-hint-text {
          font-size: 9px;
          color: #64748b;
          margin-top: 4px;
          font-style: italic;
        }

        .footer-note {
          margin-top: 20px;
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="header-bar">
        <h1 class="deck-title">${escapeHtml(deck.title)}</h1>
        <div class="deck-meta">
          <span><span class="badge">Subject:</span> ${escapeHtml(deck.topic)}</span>
          <span><span class="badge">Difficulty:</span> ${escapeHtml(deck.difficulty.toUpperCase())}</span>
          <span><span class="badge">Total Cards:</span> ${deck.flashcards.length}</span>
          <span><span class="badge">Printed:</span> ${dateStr}</span>
        </div>
      </div>

      ${cardsHtml}

      <div class="footer-note">
        Generated by StudyPulse • Active Study Deck • Master Your Material Offline
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
