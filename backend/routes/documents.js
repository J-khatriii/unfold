import express from "express";
import multer from "multer";

import { getSections, listDocuments, uploadDocument } from "../controllers/documentController.js";

const documentRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

documentRouter.post("/", upload.single("file"), uploadDocument);
documentRouter.get("/", listDocuments);
documentRouter.get("/:id/sections", getSections);

// rm 
// documentRouter.post("/", (req, res) => {
//     console.log(req.headers);
//     console.log(req.rawHeaders);

//     req.on("data", chunk => {
//         console.log("chunk", chunk.length);
//     });

//     req.on("end", () => {
//         console.log("request ended");
//         res.send("ok");
//     });
// });

export default documentRouter;
