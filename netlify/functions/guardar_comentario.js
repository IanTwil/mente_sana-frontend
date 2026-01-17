const { Client } = require('pg');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL; const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    const data = JSON.parse(event.body);

    // Validamos que vengan los datos
    const nombre = data.nombre;
    const mensaje = data.mensaje;
    const parentId = data.parent_id || null; // Si es null, es comentario nuevo. Si tiene número, es respuesta.

    try {
        await client.connect();
        const query = 'INSERT INTO comentarios (nombre, mensaje, parent_id) VALUES ($1, $2, $3) RETURNING *';
        const values = [nombre, mensaje, parentId];

        const result = await client.query(query, values);
        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(result.rows[0])
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};