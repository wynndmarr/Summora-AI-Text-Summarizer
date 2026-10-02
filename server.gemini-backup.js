require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Home
app.get("/", (req, res) => {
    res.send("Summora Backend berhasil berjalan!");
});

// Health Check
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "Summora API is running",
            database: "connected"
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Summora API is running",
            database: "disconnected"
        });
    }
});

// Test Database
app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS connected");

        res.json({
            success: true,
            message: "Database berhasil terhubung!",
            result: rows
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Database gagal terhubung"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Summora API berjalan di http://localhost:${PORT}`);
});
