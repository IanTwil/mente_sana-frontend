const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let activeRooms = [];

setInterval(() => {
    const now = Date.now();
    const antes = activeRooms.length;
    activeRooms = activeRooms.filter(room => now - room.lastSeen < 10000);
    if (activeRooms.length < antes) console.log("Salas fantasma eliminadas por tiempo");
}, 5000);

app.get('/rooms', (req, res) => {
    res.json(activeRooms);
});

app.post('/rooms/heartbeat', (req, res) => {
    const { peerId } = req.body;
    const room = activeRooms.find(r => r.peerId === peerId);
    if (room) {
        room.lastSeen = Date.now();
        res.json({ status: "ok" });
    } else {
        res.status(404).json({ error: "Sala no encontrada" });
    }
});

app.post('/rooms', (req, res) => {
    const { peerId, name } = req.body;
    activeRooms = activeRooms.filter(r => r.peerId !== peerId);

    const newRoom = {
        peerId,
        name: name || "Jugador Anónimo",
        lastSeen: Date.now() 
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