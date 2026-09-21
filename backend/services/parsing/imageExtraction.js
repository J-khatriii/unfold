import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import { v4 as uuidv4 } from "uuid";

import supabase from "../../config/storage.js";

import {
  NodeCanvasFactory,
  LINE_Y_TOLERANCE,
  PARAGRAPH_GAP_MULTIPLIER,
  BOUNDARY_LINE_COUNT,
  WORDS_PER_READER_PAGE,
  RENDER_SCALE,
  multiplyMatrix,
  applyMatrix,
  normalizeForComparison,
  isBarePageNumber,
} from "../../utils/pdfUtils.js";

import { groupItemsIntoLines } from "./textCleanup.js";

export const findImagePositions = async (page) => {
  const opList = await page.getOperatorList();
  const OPS = pdfjsLib.OPS;

  const stack = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const images = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];

    if (fn === OPS.save) {
      stack.push(ctm);
    } else if (fn === OPS.restore) {
      ctm = stack.pop() || ctm;
    } else if (fn === OPS.transform) {
      ctm = multiplyMatrix(args, ctm);
    } else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
      const corners = [
        applyMatrix(ctm, 0, 0),
        applyMatrix(ctm, 1, 0),
        applyMatrix(ctm, 0, 1),
        applyMatrix(ctm, 1, 1),
      ];

      const xs = corners.map((c) => c[0]);
      const ys = corners.map((c) => c[1]);

      images.push({
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      });
    }
  }

  return images;
}

export const extractAndUploadImage = async (canvas, viewport, bbox) => {
  const [px1, py1] = applyMatrix(viewport.transform, bbox.minX, bbox.minY);
  const [px2, py2] = applyMatrix(viewport.transform, bbox.maxX, bbox.maxY);

  const cropX = Math.max(0, Math.min(px1, px2));
  const cropY = Math.max(0, Math.min(py1, py2));
  const cropW = Math.min(canvas.width - cropX, Math.abs(px2 - px1));
  const cropH = Math.min(canvas.height - cropY, Math.abs(py2 - py1));

  if (cropW < 5 || cropH < 5) return null; // skip slivers/decorative lines mistaken for images

  const cropCanvas = createCanvas(cropW, cropH);
  const ctx = cropCanvas.getContext("2d");
  ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const buffer = cropCanvas.toBuffer("image/png");
  const path = `${uuidv4()}.png`;

  const { error } = await supabase.storage
    .from("extracted-images")
    .upload(path, buffer, { contentType: "image/png" });

  if (error) {
    console.error("Failed to upload extracted image:", error);
    return null;
  }

  const { data } = supabase.storage.from("extracted-images").getPublicUrl(path);
  return data.publicUrl;
}

export const extractPageEntries = async (page) => {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();

  const items = content.items
    .filter((item) => item.str && item.str.replace(/\s/g, "").length > 0)
    .map((item) => ({ text: item.str, x: item.transform[4], y: item.transform[5] }));

  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lineGroups = [];

  for (const item of sorted) {
    const line = lineGroups.find((l) => Math.abs(l.y - item.y) <= LINE_Y_TOLERANCE);
    if (line) line.items.push(item);
    else lineGroups.push({ y: item.y, items: [item] });
  }

  const lines = groupItemsIntoLines(items)
    .map((line) => ({
      type: "line",
      y: line.y,
      text: line.text,
    }));
    console.log("DEBUG first line:", lines[0]);


    console.log("DEBUG extracted lines:", lines);

  const imageBoxes = await findImagePositions(page);
  let imageUrls = [];

  if (imageBoxes.length > 0) {
    const canvasFactory = new NodeCanvasFactory();
    const renderViewport = page.getViewport({ scale: RENDER_SCALE });
    const canvasAndContext = canvasFactory.create(renderViewport.width, renderViewport.height);

    await page.render({
      canvasContext: canvasAndContext.context,
      viewport: renderViewport,
      canvasFactory,
      isOffscreenCanvasSupported: false,
    }).promise;

    for (const box of imageBoxes) {
      const url = await extractAndUploadImage(canvasAndContext.canvas, renderViewport, box);
      if (url) {
        imageUrls.push({ type: "image", y: (box.minY + box.maxY) / 2, url });
      }
    }
  }

  const combined = [...lines, ...imageUrls].sort((a, b) => b.y - a.y);

  return { entries: combined, height: viewport.height };
}

export const buildBlocksFromEntries = (entries, boundaryLines) => {
  // Compute typical line-spacing using ONLY consecutive text-to-text gaps
  // that have no image between them - an image-crossing gap is huge and
  // would otherwise corrupt the median on pages with few lines.
  const validGaps = [];

  for (let i = 1; i < entries.length; i++) {
    if (entries[i].type === 'line' && entries[i - 1].type === 'line') {
      validGaps.push(entries[i - 1].y - entries[i].y);
    }
  }

  const sortedGaps = [...validGaps].filter((g) => g > 2).sort((a, b) => a - b);
  // Use the smallest real gap as the baseline for "normal line spacing" -
  // within-paragraph line spacing is structurally always the tightest
  // spacing in a document, so paragraph gaps are never smaller than it.
  // This is more robust than a median on small/bimodal samples.
  const typicalGap = sortedGaps[0] || 12;

  const blocks = [];
  let currentParagraph = [];
  let prevLineY = null;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  }

  entries.forEach((entry, entryIndex) => {
    const isEdge = entryIndex < BOUNDARY_LINE_COUNT || entryIndex >= entries.length - BOUNDARY_LINE_COUNT;

    if (entry.type === "image") {
      flushParagraph();
      blocks.push({ type: "image", url: entry.url });
      prevLineY = null; // next text line shouldn't compare against text from before the image
      return;
    }

    const key = normalizeForComparison(entry.text);

    if (isEdge && (boundaryLines.has(key) || isBarePageNumber(entry.text))) {
      return; // skip header/footer/page-number
    }

    if (prevLineY !== null && prevLineY - entry.y > typicalGap * PARAGRAPH_GAP_MULTIPLIER) {
      flushParagraph();
    }

    currentParagraph.push(entry.text);
    prevLineY = entry.y;
  });

  flushParagraph();

  return blocks;
}

export const paginateBlocks = (blocks) => {
  const pages = [];
  let current = [];
  let wordCount = 0;

  const flush = () => {
    if (current.length === 0) return;

    const html = current
      .map((b) => (b.type === "image" ? `<img src="${b.url}" alt="" />` : `<p>${b.text}</p>`))
      .join('');

    pages.push(html);
    current = [];
    wordCount = 0;
  }

  for (const block of blocks) {
    current.push(block);

    if (block.type === "paragraph") {
        wordCount += block.text.split(/\s+/).length;
    }

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