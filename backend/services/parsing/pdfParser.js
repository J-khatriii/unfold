import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  detectRecurringBoundaryLines,
  extractPagesRaw, 
  groupItemsIntoLines, 
  groupLinesIntoParagraphs, 
  isBarePageNumber, 
  normalizeForComparison, 
  paginateParagraphs,
} from "./textCleanup.js";

// const HEADER_FOOTER_ZONE = 0.08;
const BOUNDARY_LINE_COUNT = 3;

const pdfParse = async (buffer) => {
  // rm
  // const safeBuffer = new Uint8Array(buffer);
  const rawPages = await extractPagesRaw(buffer);

  const pagesOfLines = rawPages.map((p) => groupItemsIntoLines(p.items));
  const boundaryLines = detectRecurringBoundaryLines(pagesOfLines);

  // rm
  console.log('DEBUG: boundary lines detected:', [...boundaryLines]);

  const cleanedParagraphsByPage = pagesOfLines.map((lines) => {
    const contentLines = lines.filter((line, index) => {
      const isEdgeLine = index < BOUNDARY_LINE_COUNT || index >= lines.length - BOUNDARY_LINE_COUNT;
      const key = normalizeForComparison(line.text);

      if (isEdgeLine && boundaryLines.has(key)) {
        return false;
      }
      
      if (isEdgeLine && isBarePageNumber(line.text)) {
        return false;
      }

      return true;
    });

    return groupLinesIntoParagraphs(contentLines);
  });

  const allParagraphs = cleanedParagraphsByPage.flat();

  return paginateParagraphs(allParagraphs);
}

export default pdfParse;


// const pdfParse = async (buffer) => {
//   const rawPages = await extractPagesRaw(buffer);
//   const pageHeights = rawPages.map((p) => p.height);

//   const pagesOfLines = rawPages.map((p) => groupItemsIntoLines(p.items));
//   const boundaryLines = detectRecurringBoundaryLines(pagesOfLines, pageHeights);

//   console.log('DEBUG: total pages:', rawPages.length);
//   console.log('DEBUG: boundary lines detected:', [...boundaryLines]);

//   console.log('DEBUG: page 1 lines with y-position:');
//   pagesOfLines[0]?.forEach((l) => console.log(`  y=${l.y.toFixed(1)} height=${pageHeights[0].toFixed(1)} "${l.text}"`));

//   const cleanedParagraphsByPage = pagesOfLines.map((lines, i) => {
//     const height = pageHeights[i];

//     const contentLines = lines.filter((line) => {
//       const nearTop = line.y > height * (1 - HEADER_FOOTER_ZONE);
//       const nearBottom = line.y < height * HEADER_FOOTER_ZONE;
//       const key = line.text.replace(/\d+/g, '#');

//       if ((nearTop || nearBottom) && boundaryLines.has(key)) return false;
//       if ((nearTop || nearBottom) && isBarePageNumber(line.text)) return false;

//       return true;
//     });

//     return groupLinesIntoParagraphs(contentLines);
//   });

//   const allParagraphs = cleanedParagraphsByPage.flat();
//   return paginateParagraphs(allParagraphs);
// }