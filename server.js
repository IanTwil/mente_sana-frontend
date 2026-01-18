const express = require('express');
const { Pool } = require('pg');
// Busca donde dice const cors = ... y asegúrate que esté así:
const cors = require('cors');
app.use(cors({
    origin: '*', // Esto permite que cualquier origen (como tu GitHub Pages) acceda
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
}));

const app = express();

// 1. CONFIGURACIÓN DE MIDDLEWARES
app.use(cors());
app.use(express.json());

// 2. CONFIGURACIÓN DE PUERTO (Dinámico para Render)
const PORT = process.env.PORT || 10000;

// 3. CONFIGURACIÓN DE BASE DE DATOS
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 4. FUNCIÓN PARA CREAR LA TABLA
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

// 5. RUTAS
app.get('/', (req, res) => {
    res.send('Servidor de MenteSana funcionando correctamente 🚀');
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

// (Otras rutas como DELETE y ADMIN permanecen igual...)

// 6. ENCENDIDO DEL SERVIDOR (Solo una vez al final)
inicializarBaseDeDatos().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor funcionando en puerto ${PORT}`);
    });
});