// 1. Import necessary libraries
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// 2. Initialize the app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// 3. Serve the frontend files
app.use(express.static('public'));

// 4. Handle real-time connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for drawing data from a client
    socket.on('drawing', (data) => {
        // Broadcast the drawing data to all other clients
        socket.broadcast.emit('drawing', data);
    });

    // Listen for a 'clear' event from a client
    socket.on('clear', () => {
        // Broadcast the 'clear' event to all other clients
        socket.broadcast.emit('clear');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// 5. Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});