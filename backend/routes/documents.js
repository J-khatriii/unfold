import express from "express";
import multer from "multer";

import uploadDocument from "../controllers/documentController.js";

const documentRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

documentRouter.post("/", upload.single("file"), uploadDocument);

export default documentRouter;
