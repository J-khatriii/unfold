import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  detectRecurringBoundaryLines,
  extractPagesRaw, 
  groupItemsIntoLines,
} from "./textCleanup.js";

import { 
  buildBlocksFromEntries,
  extractPageEntries,
  paginateBlocks,
} from "./imageExtraction.js";

import {
  NodeCanvasFactory,
  isBarePageNumber, 
  normalizeForComparison, 
} from "../../utils/pdfUtils.js";

const pdfParse = async (buffer) => {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  const pagesOfEntries = [];

  for(let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);

    const { entries } = await extractPageEntries(page);

    pagesOfEntries.push(entries);
  }

  const boundaryLines = detectRecurringBoundaryLines(
    pagesOfEntries.filter(page => page.some(entry => entry.type === "line"))
  );

  // rm
  console.log('DEBUG: boundary lines detected:', [...boundaryLines]);

  const allBlocks = pagesOfEntries.flatMap((entries) => buildBlocksFromEntries(entries, boundaryLines));

  console.log("DEBUG allBlocks:", JSON.stringify(allBlocks, null, 2));

const result = paginateBlocks(allBlocks);

console.log("DEBUG parsed result:", JSON.stringify(result, null, 2));

return result;

}

export default pdfParse;
