import express from "express";
import cors from "cors";
import healthRouter from "./routes/healthRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

app.use("/", healthRouter);

app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
