import { getFileType, createDocument } from "..//services/documentService.js";

const uploadDocument = async (req, res) => {

  // rm
  console.log("Headers:", req.headers);
  console.log("Content-Type:", req.get("content-type"));
  console.log("Body:", req.body);
  console.log("File:", req.file);
  console.log("1. Request received, file: ", req.file?.originalname);
  //

  if (!req.file) {
    return res.status(400).json({error: "No file uploaded" });
  }

  const fileType = getFileType(req.file.mimetype);

  // rm
  console.log("2. File type detected:", fileType);

  if (!fileType) {
    return res.status(400).json({ error: "Only PDF and DOCX files are supported" });
  }

  try {
    const document = await createDocument(req.file, fileType);
    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
}

export default uploadDocument;
