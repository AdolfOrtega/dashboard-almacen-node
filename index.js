require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Ajuste de archivos estáticos: Tus archivos están en la raíz del proyecto
app.use(express.static(__dirname));

// ─── Conexión a la BD (Configuración optimizada para TiDB) ──────────────────
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "4000"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Forzamos SSL si estamos en la nube o es TiDB
  ssl: {
    rejectUnauthorized: false // Cambiado a false para evitar errores de certificados autofirmados en la nube
  },
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
  router.get("/", async (req, res) => {
    try {
      const db = await getPool();
      const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY id DESC`);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

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

// ─── Rutas API ─────────────────────────────────────────────────────────────
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

// Health check para probar conexión desde el navegador
app.get("/api/health", async (req, res) => {
  try {
    const db = await getPool();
    await db.execute("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// SPA fallback: Sirve el index.html de la raíz
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ─── Arranque ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// En Vercel no es necesario el app.listen, pero lo dejamos para local
if (process.env.NODE_ENV !== 'production') {
    initDB().then(() => {
        app.listen(PORT, () => console.log(`🚀 Local: http://localhost:${PORT}`));
    });
} else {
    // En producción solo inicializamos las tablas
    initDB();
}

module.exports = app;

// 1. Middlewares primero
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

// 2. Rutas de la API (DEBEN IR ANTES DEL *)
app.use("/api/conceptos", conceptosRouter);
app.use("/api/destinos", destinosRouter);
app.use("/api/productos", productosRouter);
app.use("/api/unidades", unidadesRouter);

// 3. El comodín siempre al FINAL
app.get("*", (req, res) => {
    // Si la ruta empieza por /api y llegó aquí, es que la ruta no existe
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "Ruta de API no encontrada" });
    }
    res.sendFile(path.join(__dirname, "index.html"));
});