const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // Para permitir peticiones desde el frontend
const app = express();
app.use(express.json());
app.use(cors());
// Configuración de la conexión
const db = mysql.createConnection({
host: 'localhost',
user: 'root',
password: '', // Tu contraseña de MySQL
database: 'almacen_node'
});
db.connect(err => {
if (err) throw err;
console.log(' Conectado a la base de datos MySQL');
});
// --- RUTAS API ---
// 1. Obtener todos los conceptos (GET)
app.get('/api/conceptos', (req, res) => {
db.query('SELECT * FROM conceptos', (err, results) => {
if (err) return res.status(500).send(err);
res.json(results);
});
});
// 2. Insertar un concepto (POST)
app.post('/api/conceptos', (req, res) => {
    console.log("Datos recibidos:", req.body); // <-- AGREGA ESTO PARA DEPURAR
    const { clave, descripcion } = req.body;
    const query = 'INSERT INTO conceptos (clave, descripcion) VALUES (?, ?)';
    db.query(query, [clave, descripcion], (err, result) => {
        if (err) {
            console.error("Error al insertar:", err); // <-- AGREGA ESTO
            return res.status(500).send(err);
        }
        res.json({ mensaje: 'Concepto guardado' });
    });
});
// 3. Eliminar un concepto (DELETE)
app.delete('/api/conceptos/:clave', (req, res) => {
const { clave } = req.params;
db.query('DELETE FROM conceptos WHERE clave = ?', [clave], (err, result) => {
if (err) return res.status(500).send(err);
res.json({ mensaje: 'Concepto eliminado' });
});
});
app.listen(3000, () => console.log(' Servidor corriendo en http://localhost:3000'));