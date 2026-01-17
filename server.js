const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// --- CONFIGURACIÓN DE PUERTO PARA RENDER ---
const port = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE CONEXIÓN DINÁMICA ---
// Usará tu PC local si no hay URL de nube, o Render si ya está publicado
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());

// RUTA DE INICIO (Para saber si el servidor vive)
app.get('/', (req, res) => {
    res.send('Servidor de MenteSana funcionando correctamente 🚀');
});

// POST: GUARDAR COMENTARIO (Con tu filtro de insultos)
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

// GET: CARGAR COMENTARIOS POR LECTURA
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

// DELETE: ELIMINAR (Con tu clave de seguridad)
app.delete('/comentarios/:id', async (req, res) => {
    const { id } = req.params;
    const adminKey = req.headers['x-admin-key'];
    const CLAVE_SECRETA = "DoloresSucre2024";

    if (adminKey !== CLAVE_SECRETA) {
        return res.status(401).send('No autorizado: Clave incorrecta');
    }

    try {
        await pool.query('DELETE FROM comentarios WHERE id = $1', [id]);
        res.send('Comentario eliminado');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error');
    }
});

// ADMIN: VER TODO
app.get('/admin/todo', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM comentarios ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Error');
    }
});

app.listen(port, () => {
    console.log(`Servidor en puerto ${port}`);
});