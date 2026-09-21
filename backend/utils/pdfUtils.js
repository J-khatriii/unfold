import { createCanvas, Image } from "@napi-rs/canvas";

// pdfjs-dist expects a browser-like Image global in Node
global.Image = Image;

export const LINE_Y_TOLERANCE = 3;

export const PARAGRAPH_GAP_MULTIPLIER = 1.6;

export const MIN_PAGES_FOR_BOUNDARY_DETECTION = 3;

export const WORDS_PER_READER_PAGE = 200;

export const BOUNDARY_LINE_COUNT = 3;

export const RENDER_SCALE = 2;

export class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);

    return { canvas, context: canvas.getContext("2d") };
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

export const multiplyMatrix = (m1, ctm) => {
  return [
    m1[0] * ctm[0] + m1[1] * ctm[2],
    m1[0] * ctm[1] + m1[1] * ctm[3],
    m1[2] * ctm[0] + m1[3] * ctm[2],
    m1[2] * ctm[1] + m1[3] * ctm[3],
    m1[4] * ctm[0] + m1[5] * ctm[2] + ctm[4],
    m1[4] * ctm[1] + m1[5] * ctm[3] + ctm[5],
  ];
}

export const applyMatrix = (matrix, x, y) => {
  return [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  ];
}

export const normalizeForComparison = (text) => {
  if (!text) return "";
    
  return text
    .trim()
    .replace(/^[^a-zA-Z]+/, (m) => (m ? '#' : ''))
    .replace(/[^a-zA-Z]+$/, (m) => (m ? '#' : ''))
    .toLowerCase();
}

export const isBarePageNumber = (text) => {
  return /^\d{1,4}$/.test(text) || /^page\s+\d+(\s+of\s+\d+)?$/i.test(text);
}
