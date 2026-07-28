import docxParse from "./parsing/docxParser.js";
import pdfParse from "./parsing/pdfParser.js";

const parseDocument = async (buffer, fileType) => {
    if (fileType === "docx") return docxParse(buffer);

    if (fileType === "pdf") return pdfParse(buffer);

    throw new Error(`Unsupported file type: ${fileType}`);
}

export default parseDocument;
