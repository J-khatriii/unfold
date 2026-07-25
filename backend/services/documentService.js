import { v4 as uuidv4 } from "uuid";

import pool from "../config/db.js";
import supabase from "../config/storage.js";
import { parseDocument } from "./parsingService.js";

const ALLOWED_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

export const getFileType = (mimetype) => {
  return ALLOWED_TYPES[mimetype] || null;
}

export const createDocument = async (file, fileType) => {
  const storagePath = `${uuidv4()}-${file.originalname}`;

  // rm
  console.log("3. Uploading to storage:", storagePath);

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file.buffer, { contentType: file.mimetype });

  if (uploadError) throw uploadError;

  // rm
  console.log("3b. Storage upload done");

  const result = await pool.query(
    `INSERT INTO documents (filename, file_type, status)
    VALUES ($1, $2, 'processing')
    RETURNING id, filename, file_type, status`,
    [file.originalname, fileType]
  );

  const document = result.rows[0];

  // rm
  console.log("4. Document row inserted:", document.id);

  try {
    const sections = await parseDocument(file.buffer, fileType);

    // rm
    console.log("4b. Parsed sections count:", sections.length);

    for (const section of sections) {
      await pool.query(
        `INSERT INTO sections (document_id, order_index, title, content)
         VALUES ($1, $2, $3, $4)`,
        [document.id, section.order_index, section.title, section.content]
      );
    }

    // rm
    console.log("4c. All sections inserted");

    await pool.query(`UPDATE documents SET status = 'ready' WHERE id = $1`, [document.id]);

    return { ...document, status: 'ready' };
  } catch (error) {
    await pool.query(`UPDATE documents SET status = 'failed' WHERE id = $1`, [document.id]);
    throw error;
  }
}

export const getAllDocuments = async () => {
  const result = await pool.query('SELECT id, filename, file_type, status, created_at FROM documents ORDER BY created_at DESC');

  return result.rows;
}

export const getDocumentSections = async (documentId) => {
  const docResult = await pool.query(
    'SELECT id, filename, status FROM documents WHERE id = $1',
    [documentId]
  );

  if(docResult.rows.length === 0) {
    return null;
  }

  const sectionsResult = await pool.query(
    'SELECT id, order_index, title, content, is_read FROM sections WHERE document_id = $1 ORDER BY order_index',
    [documentId]
  );

  return {
    document: docResult.rows[0],
    sections: sectionsResult.rows,
  }
}
