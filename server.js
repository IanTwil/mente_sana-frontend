const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
}));
app.use(express.json());


const PORT = process.env.PORT || 10000;


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


const inicializarBaseDeDatos = async () => {

    const queryTablaComentarios = `
        CREATE TABLE IF NOT EXISTS comentarios (
            id SERIAL PRIMARY KEY,
            lectura_id VARCHAR(50) NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            contenido TEXT NOT NULL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;


    const queryTablaUsuarios = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            nombre_real VARCHAR(100) UNIQUE NOT NULL,
            rol VARCHAR(50) NOT NULL,
            digitos_id VARCHAR(4) NOT NULL
        );
    `;

    try {
        await pool.query(queryTablaComentarios);
        await pool.query(queryTablaUsuarios);
        console.log("✅ Tablas 'comentarios' y 'usuarios' listas");
    } catch (err) {
        console.error("❌ Error al crear las tablas:", err);
    }
};

// 6. RUTAS
app.get('/', (req, res) => {
    res.send('Servidor de MenteSana funcionando correctamente 🚀');
});

app.get('/admin/todo', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM comentarios ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error en admin/todo:", err);
        res.status(500).send('Error en el servidor al obtener todos los comentarios');
    }
});
app.get('/admin/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT nombre_real, rol, digitos_id FROM usuarios ORDER BY nombre_real ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Error al obtener usuarios');
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

    const CLAVE_SECRETA = process.env.ADMIN_PASSWORD || "VALOR_DE_SEGURIDAD_MUY_LARGO_123";

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

app.post('/obtener-identidad', async (req, res) => {
    const { nombre, rol } = req.body;

    try {
        const usuarioExistente = await pool.query(
            'SELECT digitos_id FROM usuarios WHERE nombre_real = $1 AND rol = $2',
            [nombre, rol]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.json({ digitos_id: usuarioExistente.rows[0].digitos_id });
        } else {
            const nuevoId = Math.floor(1000 + Math.random() * 9000).toString();

            await pool.query(
                'INSERT INTO usuarios (nombre_real, rol, digitos_id) VALUES ($1, $2, $3)',
                [nombre, rol, nuevoId]
            );

            return res.json({ digitos_id: nuevoId });
        }
    } catch (err) {
        console.error("Error en obtener-identidad:", err);
        res.status(500).json({ error: 'Error al procesar identidad' });
    }
});

// 7. ENCENDIDO DEL SERVIDOR
inicializarBaseDeDatos().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor funcionando en puerto ${PORT}`);
    });
});