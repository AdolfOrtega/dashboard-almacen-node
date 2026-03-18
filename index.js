require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ─── Conexión a la BD ──────────────────────────────────────────────────────
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes("tidb")
    ? { rejectUnauthorized: true }
    : undefined,
  waitForConnections: true,
  connectionLimit: 5,
};

let pool;
async function getPool() {
  if (!pool) pool = mysql.createPool(dbConfig);
  return pool;
}

// ─── Inicialización de tablas ──────────────────────────────────────────────
async function initDB() {
  try {
    const db = await getPool();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conceptos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS destinos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        direccion VARCHAR(200),
        responsable VARCHAR(100),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) DEFAULT 0,
        stock INT DEFAULT 0,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS unidades_medida (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        abreviatura VARCHAR(10) NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tablas inicializadas correctamente");
  } catch (err) {
    console.error("❌ Error inicializando BD:", err.message);
  }
}

// ─── Helper: rutas CRUD genéricas ─────────────────────────────────────────
function makeCRUD(router, table, fields) {
  // GET all
  router.get("/", async (req, res) => {
    try {
      const db = await getPool();
      const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY id DESC`);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET one
  router.get("/:id", async (req, res) => {
    try {
      const db = await getPool();
      const [rows] = await db.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: "No encontrado" });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post("/", async (req, res) => {
    try {
      const db = await getPool();
      const vals = fields.map((f) => req.body[f] ?? null);
      const cols = fields.join(", ");
      const placeholders = fields.map(() => "?").join(", ");
      const [result] = await db.execute(
        `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`,
        vals
      );
      const [rows] = await db.execute(`SELECT * FROM ${table} WHERE id = ?`, [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  router.put("/:id", async (req, res) => {
    try {
      const db = await getPool();
      const vals = fields.map((f) => req.body[f] ?? null);
      const setClause = fields.map((f) => `${f} = ?`).join(", ");
      await db.execute(`UPDATE ${table} SET ${setClause} WHERE id = ?`, [...vals, req.params.id]);
      const [rows] = await db.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete("/:id", async (req, res) => {
    try {
      const db = await getPool();
      await db.execute(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json({ message: "Eliminado correctamente" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// ─── Rutas ────────────────────────────────────────────────────────────────
const conceptosRouter = express.Router();
makeCRUD(conceptosRouter, "conceptos", ["nombre", "descripcion"]);
app.use("/api/conceptos", conceptosRouter);

const destinosRouter = express.Router();
makeCRUD(destinosRouter, "destinos", ["nombre", "direccion", "responsable"]);
app.use("/api/destinos", destinosRouter);

const productosRouter = express.Router();
makeCRUD(productosRouter, "productos", ["nombre", "descripcion", "precio", "stock"]);
app.use("/api/productos", productosRouter);

const unidadesRouter = express.Router();
makeCRUD(unidadesRouter, "unidades_medida", ["nombre", "abreviatura"]);
app.use("/api/unidades", unidadesRouter);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const db = await getPool();
    await db.execute("SELECT 1");
    res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ─── Arranque ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
});

module.exports = app;
