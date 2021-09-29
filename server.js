const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const gamelogic = require('./gamelogic.js') //gamelogic defines how the socket handles each event

const PORT = process.env.PORT || 4000 ;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//This runs when a client connects (socket=client)
io.on('connection', socket =>{
    console.log("Connection established on socket ", socket.id)
    gamelogic.connection(io, socket) //sets up socket event listeners
})
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
