const { Client } = require('pg');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const id = JSON.parse(event.body).id;

    try {
        await client.connect();
        // Aumentamos el contador de likes en 1 para ese ID específico
        await client.query('UPDATE comentarios SET likes = likes + 1 WHERE id = $1', [id]);
        await client.end();

        return { statusCode: 200, body: 'Like registrado' };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};