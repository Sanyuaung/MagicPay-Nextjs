import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PdfTable = {
  title: string;
  subtitle?: string;
  summaryLines?: string[];
  headers: string[];
  rows: string[][];
};

export async function buildSimpleTablePdf(
  table: PdfTable,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 30;
  const rowHeight = 20;
  const colCount = table.headers.length || 1;
  const usableWidth = width - margin * 2;
  const colWidth = usableWidth / colCount;

  let y = height - margin;

  page.drawText(table.title, {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0.11, 0.15, 0.23),
  });

  y -= 18;
  if (table.subtitle) {
    page.drawText(table.subtitle, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.35, 0.4, 0.47),
    });
    y -= 20;
  } else {
    y -= 12;
  }

  if (table.summaryLines && table.summaryLines.length > 0) {
    for (const line of table.summaryLines.slice(0, 4)) {
      page.drawText(line, {
        x: margin,
        y,
        size: 9,
        font,
        color: rgb(0.28, 0.33, 0.4),
      });
      y -= 14;
    }
    y -= 6;
  }

  page.drawRectangle({
    x: margin,
    y: y - rowHeight + 4,
    width: usableWidth,
    height: rowHeight,
    color: rgb(0.93, 0.96, 0.99),
  });

  table.headers.forEach((header, index) => {
    page.drawText(header, {
      x: margin + index * colWidth + 4,
      y: y - 12,
      size: 9,
      font: boldFont,
      color: rgb(0.2, 0.24, 0.3),
    });
  });

  y -= rowHeight;

  const maxRows = Math.floor((y - margin) / rowHeight);
  const safeRows = table.rows.slice(0, Math.max(0, maxRows));

  safeRows.forEach((row, rowIndex) => {
    const rowY = y - rowIndex * rowHeight;

    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: rowY - rowHeight + 4,
        width: usableWidth,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    row.forEach((cell, colIndex) => {
      const text = cell.length > 26 ? `${cell.slice(0, 23)}...` : cell;
      page.drawText(text, {
        x: margin + colIndex * colWidth + 4,
        y: rowY - 12,
        size: 8.5,
        font,
        color: rgb(0.17, 0.2, 0.25),
      });
    });
  });

  return pdfDoc.save();
}
