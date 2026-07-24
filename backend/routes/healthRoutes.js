import express from "express";

import healthCheck from "../controllers/healthController.js";

const healthRouter = express.Router();

healthRouter.get("/health-check", healthCheck);

export default healthRouter;
