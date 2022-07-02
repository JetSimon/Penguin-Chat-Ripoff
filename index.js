const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

const port = process.env.PORT || 80

const DEFAULT_SERVER = "DEFAULT"

class Player {
    constructor(x,y,name) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
    }
}

let players = {}

io.on('connection', (socket) => {

    let playerName;

    socket.on('connected', (name) => {
        socket.join(DEFAULT_SERVER);
        console.log(`player ${name} connected`);
        players[name] = new Player(128, 128, name);
        playerName = name;
        io.sockets.in(DEFAULT_SERVER).emit('addPlayer', players[playerName]);
    })

    socket.on('disconnect', () => {
        console.log(`player ${playerName} disconnected`);
        socket.leave(DEFAULT_SERVER);
        delete players[playerName];
        io.sockets.in(DEFAULT_SERVER).emit('deletePlayer', playerName);
    });

    socket.on('playerMoving', (name, x, y, targetX, targetY) => {
        players[name].x = x;
        players[name].y = y;
        players[name].targetX = targetX;
        players[name].targetY = targetY;
        io.sockets.in(DEFAULT_SERVER).emit('updatePlayer', players[playerName]);
    });

    socket.on('getAllPlayers', (codeName) => {
        io.sockets.in(DEFAULT_SERVER).emit('sendAllPlayers', players, codeName);
    });

});

server.listen(port, () => {
    console.log('listening on ' + port)
});