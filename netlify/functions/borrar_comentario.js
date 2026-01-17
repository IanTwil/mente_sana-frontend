const { Client } = require('pg');

exports.handler = async (event) => {
    // Solo permitimos peticiones de tipo DELETE
    if (event.httpMethod !== 'DELETE') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const id = event.queryStringParameters.id;

    try {
        await client.connect();
        // Borra el comentario principal y cualquier respuesta asociada (parent_id)
        await client.query('DELETE FROM comentarios WHERE id = $1 OR parent_id = $1', [id]);
        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Comentario eliminado" })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};