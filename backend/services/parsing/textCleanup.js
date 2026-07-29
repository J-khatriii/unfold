import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const LINE_Y_TOLERANCE = 3;
// const HEADER_FOOTER_ZONE = 0.08;
const PARAGRAPH_GAP_MULTIPLIER = 1.6;
const MIN_PAGES_FOR_BOUNDARY_DETECTION = 3;
const WORDS_PER_READER_PAGE = 200;
const BOUNDARY_LINE_COUNT = 3;

export const extractPagesRaw = async (buffer) => {
  const uint8Array = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength
  );

  const doc = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  const pages = [];

  for(let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewPort = page.getViewport({ scale : 1 });
    const content = await page.getTextContent();

    const items = content.items
      .filter((item) => item.str.trim().length > 0)
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
      }));

    pages.push({ items, height: viewPort.height });
  }

  return pages;
}

export const groupItemsIntoLines = (items) => {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];

  for(const item of sorted) {
    const line = lines.find((l) => Math.abs(l.y - item.y) <= LINE_Y_TOLERANCE);

    if (line) {
      line.items.push(item);
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  return lines
    .map((line) => ({
      y: line.y,
      text: line.items
        .sort((a, b) => a.x - b.x)
        .map((i) => i.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    }))
    .filter((l) => l.text.length > 0);
}

// export const detectRecurringBoundaryLines = (pagesOfLines, pageHeights) => {
//   const counts = {};

//   pagesOfLines.forEach((lines, i) => {
//     const height = pageHeights[i];
//     lines.forEach((line) => {
//       const nearTop = line.y > height * (1 - HEADER_FOOTER_ZONE);
//       const nearBottom = line.y < height * HEADER_FOOTER_ZONE;
//       if (!nearTop && !nearBottom) return;

//       const key = line.text.replace(/\d+/g, '#');
//       counts[key] = (counts[key] || 0) + 1;
//     });
//   });

//   const pageCount = pagesOfLines.length;
//   if (pageCount < MIN_PAGES_FOR_BOUNDARY_DETECTION) return new Set();

//   return new Set(
//     Object.entries(counts)
//       .filter(([, count]) => count >= pageCount * 0.6)
//       .map(([key]) => key)
//   );
// }


export const normalizeForComparison = (text) => {
  return text
    .trim()
    .replace(/^[^a-zA-Z]+/, '')  // strip leading digits/glyphs/punctuation
    .replace(/[^a-zA-Z]+$/, '')  // strip trailing digits/glyphs/punctuation
    .toLowerCase();
}

export const detectRecurringBoundaryLines = (pagesOfLines) => {
  const counts = {};

  pagesOfLines.forEach((lines) => {
    const uniqueKeysOnThisPage = new Set(
      [
        ...lines.slice(0, BOUNDARY_LINE_COUNT),
        ...lines.slice(-BOUNDARY_LINE_COUNT),
      ]
        .map((line) => normalizeForComparison(line.text))
        .filter(Boolean)
    );

    uniqueKeysOnThisPage.forEach((key) => {
      counts[key] = (counts[key] || 0) + 1;
    });
  });

  const pageCount = pagesOfLines.length;
  if (pageCount < MIN_PAGES_FOR_BOUNDARY_DETECTION) {
    return new Set();
  }

  return new Set(
    Object.entries(counts)
      .filter(([, count]) => count >= pageCount * 0.4)
      .map(([key]) => key)
  );
}

export const isBarePageNumber = (text) => {
  return /^\d{1,4}$/.test(text) || /^page\s+\d+(\s+of\s+\d+)?$/i.test(text);
}

export const groupLinesIntoParagraphs = (lines) => {
  if (lines.length === 0) return [];

  const gaps = [];

  for (let i = 1; i < lines.length; i++) {
    gaps.push(lines[i - 1].y - lines[i].y);
  }

  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const typicalGap = sortedGaps[Math.floor(sortedGaps.length / 2)] || 12;

  const paragraphs = [];
  let current = [lines[0].text];

  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i - 1].y - lines[i].y;

    if (gap > typicalGap * PARAGRAPH_GAP_MULTIPLIER) {
      paragraphs.push(current.join(' '));
      current = [];
    }
    current.push(lines[i].text);
  }

  if (current.length) {
    paragraphs.push(current.join(' '));
  }

  return paragraphs;
}

export const paginateParagraphs = (paragraphs) => {
  const pages = [];
  let current = [];
  let wordCount = 0;

  const flush = () => {
    if (current.length === 0) return;

    pages.push(current.map((p) => `<p>${p}</p>`).join(''));
    current = [];
    wordCount = 0;
  }

  for (const paragraph of paragraphs) {
    current.push(paragraph);
    wordCount += paragraph.split(/\s+/).length;

    if (wordCount >= WORDS_PER_READER_PAGE) {
      flush();
    }
  }

  flush();

  return pages.map((content, index) => ({
    title: `Page ${index + 1}`,
    content,
    order_index: index,
  }));
}
