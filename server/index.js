const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Room = require('./Room');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Game rooms
const rooms = new Map();
let roomIdCounter = 0;

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Join room
    socket.on('room:join', (data) => {
        const { playerName } = data;

        // Find or create a room
        let room = findAvailableRoom();
        if (!room) {
            room = new Room(`room-${++roomIdCounter}`, io);
            rooms.set(room.id, room);
        }

        // Add player to room
        const success = room.addPlayer(socket, playerName);
        if (success) {
            socket.join(room.id);
            socket.roomId = room.id;
            console.log(`Player ${playerName} joined ${room.id}`);
        }
    });

    // Player input
    socket.on('input', (data) => {
        const room = rooms.get(socket.roomId);
        if (room && room.game) {
            room.game.queueInput(socket.id, data);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        const room = rooms.get(socket.roomId);
        if (room) {
            room.removePlayer(socket.id);

            // Clean up empty rooms
            if (room.players.size === 0) {
                room.destroy();
                rooms.delete(room.id);
            }
        }
    });
});

// Find a room that's not full
function findAvailableRoom() {
    for (const room of rooms.values()) {
        if (room.players.size < room.maxPlayers && room.state === 'WAITING') {
            return room;
        }
    }
    return null;
}

// Start server
httpServer.listen(PORT, () => {
    console.log(`Multiplayer Pac-Man server running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
