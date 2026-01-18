const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express(); // 1. PRIMERO creamos la app

// 2. LUEGO configuramos los Middlewares
app.use(cors({
    origin: '*', // Permite conexiones desde GitHub Pages o cualquier sitio
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// 3. CONFIGURACIÓN DE PUERTO (Dinámico para Render)
const PORT = process.env.PORT || 10000;

// 4. CONFIGURACIÓN DE BASE DE DATOS
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 5. FUNCIÓN PARA CREAR LA TABLA
const inicializarBaseDeDatos = async () => {
    const queryTabla = `
        CREATE TABLE IF NOT EXISTS comentarios (
            id SERIAL PRIMARY KEY,
            lectura_id VARCHAR(50) NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            contenido TEXT NOT NULL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(queryTabla);
        console.log("✅ Tabla 'comentarios' lista");
    } catch (err) {
        console.error("❌ Error al crear la tabla:", err);
    }
};

// 6. RUTAS
app.get('/', (req, res) => {
    res.send('Servidor de MenteSana funcionando correctamente 🚀');
});

// Ruta para el panel de administración
app.get('/admin/todo', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM comentarios ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error en admin/todo:", err);
        res.status(500).send('Error en el servidor al obtener todos los comentarios');
    }
});

app.post('/comentarios', async (req, res) => {
    const { lectura_id, nombre, contenido } = req.body;
    const palabrasProhibidas = ['tonto', 'estúpido', 'basura', 'mierda', 'puto'];

    const contieneInsulto = palabrasProhibidas.some(palabra =>
        contenido.toLowerCase().includes(palabra) ||
        nombre.toLowerCase().includes(palabra)
    );

    if (contieneInsulto) {
        return res.status(400).json({ error: 'Por favor, mantengamos un lenguaje respetuoso.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO comentarios (lectura_id, nombre, contenido) VALUES ($1, $2, $3) RETURNING *',
            [lectura_id, nombre, contenido]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
});

app.get('/comentarios/:lectura_id', async (req, res) => {
    const { lectura_id } = req.params;
    try {
        const result = await pool.query(
            'SELECT nombre, contenido, fecha FROM comentarios WHERE lectura_id = $1 ORDER BY fecha DESC',
            [lectura_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});

// Ruta para eliminar comentarios
app.delete('/comentarios/:id', async (req, res) => {
    const { id } = req.params;
    const adminKey = req.headers['x-admin-key'];
    const CLAVE_SECRETA = "DoloresSucre2024";

    if (adminKey !== CLAVE_SECRETA) {
        return res.status(401).send('No autorizado');
    }

    try {
        await pool.query('DELETE FROM comentarios WHERE id = $1', [id]);
        res.send('Comentario eliminado');
    } catch (err) {
        res.status(500).send('Error');
    }
});

// 7. ENCENDIDO DEL SERVIDOR
inicializarBaseDeDatos().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor funcionando en puerto ${PORT}`);
    });
});