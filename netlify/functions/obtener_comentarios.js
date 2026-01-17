const { Client } = require('pg');

exports.handler = async (event, context) => {
    // Conexión segura usando la variable de entorno de Netlify
    const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL; const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        // Traemos todos los comentarios ordenados por fecha (los más nuevos primero)
        const result = await client.query('SELECT * FROM comentarios ORDER BY fecha DESC');
        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify(result.rows)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};