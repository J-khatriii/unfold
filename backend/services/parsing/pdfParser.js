// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// // pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// const pdfParse = async (buffer) => {
//     const uint8Array = new Uint8Array(
//         buffer.buffer,
//         buffer.byteOffset,
//         buffer.byteLength
//     );

//     const doc = await pdfjsLib.getDocument({ data: uint8Array }).promise;

//     const pages = [];

//     for(let i = 1; i <= doc.numPages; i++) {
//         const page = await doc.getPage(i);
//         const content = await page.getTextContent();
//         const viewPort = page.getViewport({ scale : 1});

//         const items = content.items.map((item) => ({
//             text: item.str,
//             y: Math.round(item.transform[5]),
//             height: viewPort.height,
//         }));

//         pages.push(items);
//     }

//     return pages;
// }

// export default pdfParse;

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const pdfParse = async (buffer) => {
  const uint8Array = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength
  );

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  const sections = [];

//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i);
//     const content = await page.getTextContent();

//     const text = content.items
//       .map(item => item.str)
//       .join(" ")
//       .replace(/\s+/g, " ")
//       .trim();

//     sections.push({
//       order_index: i - 1,
//       title: `Page ${i}`,
//       content: text,
//     });
//   }

for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const textContent = await page.getTextContent();

  // Group text by Y coordinate (same visual line)
  const lines = new Map();

  for (const item of textContent.items) {
    if (!("str" in item)) continue;

    const x = item.transform[4];
    const y = Math.round(item.transform[5]);

    if (!lines.has(y)) {
      lines.set(y, []);
    }

    lines.get(y).push({
      text: item.str,
      x,
      width: item.width,
      fontSize: Math.abs(item.transform[3]),
    });
  }

  // Sort lines from top to bottom
  const sortedLines = [...lines.entries()].sort((a, b) => b[0] - a[0]);

  let pageText = "";
  let previousY = null;

  for (const [y, words] of sortedLines) {
    // Sort words left to right
    words.sort((a, b) => a.x - b.x);

    let line = "";

    for (let j = 0; j < words.length; j++) {
      const current = words[j];

      if (j > 0) {
        const previous = words[j - 1];

        // Gap between previous word and current word
        const gap = current.x - (previous.x + previous.width);

        if (gap > 25) {
          line += "    "; // big horizontal gap
        } else {
          line += " ";
        }
      }

      line += current.text;
    }

    // Paragraph detection
    if (previousY !== null) {
      const verticalGap = previousY - y;

      if (verticalGap > 22) {
        pageText += "\n\n";
      } else {
        pageText += "\n";
      }
    }

    pageText += line.trimEnd();
    previousY = y;
  }

  sections.push({
    order_index: i - 1,
    title: `Page ${i}`,
    content: pageText,
  });
}

  return sections;
}

export default pdfParse;

