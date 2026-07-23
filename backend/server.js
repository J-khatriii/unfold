import express from "express";
import cors from "cors";
import "dotenv/config";

import supabase from "./config/storage.js";
import pool from "./config/db.js";
import healthRouter from "./routes/healthRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/", healthRouter);

app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

app.get("/test-storage", async (req, res) => {
    try {
        const { data, error } = await supabase.storage.from("documents").list();
        
        if(error) throw error;

        res.json(data);
    } catch (error) {
        console.error(err);
        res.status(500).json({ error: 'Storage connection failed' });
    }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
