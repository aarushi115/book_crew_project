import { jsPDF } from 'jspdf';
import { marked } from 'marked';

const MARGIN = 20;
const BODY_SIZE = 11;
const BODY_LINE = 5.5;

function sanitizeFilename(name) {
  return (name || 'generated-book')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 80) || 'generated-book';
}

function inlineText(token) {
  if (!token) return '';
  if (token.type === 'text') return token.text;
  if (token.type === 'codespan') return token.text;
  if (token.type === 'link') return token.text || inlineText({ tokens: token.tokens });
  if (token.tokens?.length) return token.tokens.map(inlineText).join('');
  return token.text || '';
}

function blockText(token) {
  if (!token) return '';
  if (token.text && !token.tokens) return token.text;
  if (token.tokens?.length) return token.tokens.map(inlineText).join('');
  return token.text || '';
}

function getListItemText(item) {
  return (item.tokens || [])
    .map((t) => (t.type === 'paragraph' || t.type === 'text' ? blockText(t) : inlineText(t)))
    .join(' ')
    .trim();
}

function pageBottom(doc) {
  return doc.internal.pageSize.getHeight() - MARGIN;
}

function pageWidth(doc) {
  return doc.internal.pageSize.getWidth() - MARGIN * 2;
}

function ensureSpace(doc, y, needed) {
  if (y + needed > pageBottom(doc)) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function drawLines(doc, lines, x, y, lineHeight) {
  const blockHeight = lines.length * lineHeight;
  y = ensureSpace(doc, y, blockHeight);
  doc.text(lines, x, y);
  return y + blockHeight;
}

function renderParagraph(doc, text, x, y, maxWidth) {
  if (!text.trim()) return y + 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(30);

  const lines = doc.splitTextToSize(text.trim(), maxWidth);
  return drawLines(doc, lines, x, y, BODY_LINE) + 4;
}

function renderHeading(doc, text, depth, x, y, maxWidth) {
  const size = depth === 1 ? 15 : depth === 2 ? 13 : 12;
  const lineHeight = size * 0.42;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(20);

  const lines = doc.splitTextToSize(text.trim(), maxWidth);
  y = drawLines(doc, lines, x, y, lineHeight) + 6;
  doc.setTextColor(30);
  return y;
}

function renderList(doc, items, ordered, x, y, maxWidth) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(30);

  const indent = 6;
  const prefixWidth = 6;

  items.forEach((item, index) => {
    const prefix = ordered ? `${index + 1}.` : '•';
    const body = getListItemText(item);
    const lines = doc.splitTextToSize(body, maxWidth - indent - prefixWidth);
    const blockHeight = lines.length * BODY_LINE;

    y = ensureSpace(doc, y, blockHeight + 2);
    doc.text(prefix, x + indent, y);
    doc.text(lines, x + indent + prefixWidth, y);
    y += blockHeight + 2;
  });

  return y + 4;
}

function renderCodeBlock(doc, code, x, y, maxWidth) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40);

  const lines = doc.splitTextToSize(code.trim(), maxWidth - 8);
  const blockHeight = lines.length * 5 + 10;

  y = ensureSpace(doc, y, blockHeight);
  doc.setFillColor(245, 245, 245);
  doc.rect(x, y - 4, maxWidth, blockHeight, 'F');
  doc.text(lines, x + 4, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(30);
  return y + blockHeight + 6;
}

function renderBlockquote(doc, tokens, x, y, maxWidth) {
  const text = tokens.map(blockText).join('\n');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(70);

  const lines = doc.splitTextToSize(text.trim(), maxWidth - 10);
  const blockHeight = lines.length * BODY_LINE + 6;

  y = ensureSpace(doc, y, blockHeight);
  doc.setDrawColor(180);
  doc.line(x + 2, y - 2, x + 2, y + blockHeight - 8);
  doc.text(lines, x + 8, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30);
  return y + blockHeight + 2;
}

function renderTokens(doc, tokens, x, y, maxWidth) {
  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        y = renderHeading(doc, blockText(token), token.depth, x, y, maxWidth);
        break;
      case 'paragraph':
        y = renderParagraph(doc, blockText(token), x, y, maxWidth);
        break;
      case 'list':
        y = renderList(doc, token.items, token.ordered, x, y, maxWidth);
        break;
      case 'blockquote':
        y = renderBlockquote(doc, token.tokens || [], x, y, maxWidth);
        break;
      case 'code':
        y = renderCodeBlock(doc, token.text, x, y, maxWidth);
        break;
      case 'hr':
        y = ensureSpace(doc, y, 8);
        doc.setDrawColor(210);
        doc.line(x, y, x + maxWidth, y);
        y += 10;
        break;
      case 'space':
        y += 4;
        break;
      default:
        if (token.text) {
          y = renderParagraph(doc, token.text, x, y, maxWidth);
        }
    }
  }
  return y;
}

function renderTitlePage(doc, topic, chapterCount) {
  const width = doc.internal.pageSize.getWidth();
  const title = topic || 'Generated Book';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(20);
  const titleLines = doc.splitTextToSize(title, pageWidth(doc));
  const titleY = 90;
  doc.text(titleLines, width / 2, titleY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(100);
  const meta = `${chapterCount} chapter${chapterCount !== 1 ? 's' : ''}`;
  doc.text(meta, width / 2, titleY + titleLines.length * 11 + 14, { align: 'center' });

  doc.setFontSize(11);
  doc.text('Generated by AI Book Writer Studio', width / 2, pageBottom(doc), { align: 'center' });
  doc.setTextColor(30);
}

function renderChapter(doc, chapter, index, maxWidth) {
  doc.addPage();
  let y = MARGIN;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`CHAPTER ${index + 1}`, MARGIN, y);
  y += 10;
  doc.setTextColor(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(chapter.title, maxWidth);
  y = drawLines(doc, titleLines, MARGIN, y, 9) + 4;

  doc.setDrawColor(210);
  doc.line(MARGIN, y, MARGIN + maxWidth, y);
  y += 12;

  const tokens = marked.lexer(chapter.content);
  return renderTokens(doc, tokens, MARGIN, y, maxWidth);
}

/**
 * Export the generated book as a structured PDF with a title page and chapter sections.
 * @param {string} topic
 * @param {Array<{title: string, content: string}>} chapters
 */
export async function downloadBookAsPdf(topic, chapters) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const maxWidth = pageWidth(doc);

  renderTitlePage(doc, topic, chapters.length);

  chapters.forEach((chapter, index) => {
    renderChapter(doc, chapter, index, maxWidth);
  });

  doc.save(`${sanitizeFilename(topic)}.pdf`);
}
