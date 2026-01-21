const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let activeRooms = [];

app.get('/rooms', (req, res) => {
    const now = Date.now();
    activeRooms = activeRooms.filter(room => now - room.timestamp < 3600000);
    res.json(activeRooms);
});

app.post('/rooms', (req, res) => {
    const { peerId, name } = req.body;

    activeRooms = activeRooms.filter(r => r.peerId !== peerId);

    const newRoom = {
        peerId,
        name: name || "Jugador Anónimo",
        timestamp: Date.now()
    };

    activeRooms.push(newRoom);
    res.status(201).json({ message: "Sala creada" });
});

app.delete('/rooms/:peerId', (req, res) => {
    activeRooms = activeRooms.filter(r => r.peerId !== req.params.peerId);
    res.json({ message: "Sala eliminada" });
});

app.listen(PORT, () => {
    console.log(`Servidor de Hockey corriendo en puerto ${PORT}`);
});