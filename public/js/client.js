let socket = io();
let playerName;
const penguinImage = new Image(64, 64);
penguinImage.src = "penguin.png";

socket.on('connect', function() {
    fetch('https://random-word-api.herokuapp.com/word')
    .then(response => response.json())
    .then(data => {
        playerName = data[0];
        socket.emit('connected', playerName);
        socket.emit('getAllPlayers', playerName);
    });
})

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
var form = document.getElementById('form');
var input = document.getElementById('message');

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function dist(x1, y1, x2, y2)
{
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.sqrt(a*a + b*b);
}

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return [x, y]
}

class Player {
    constructor(x,y,name) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.speed = 5;
        this.color = 0;
        this.message = '';

        for(let i = 0; i < this.name.length; i++) {
            let c = this.name[i];
            this.color += (i + c.charCodeAt());
        }

        this.color = '#' + this.color.toString(16);
    }

    draw(ctx) {
        ctx.textAlign = "center";
        // create offscreen buffer, 
        let buffer = document.createElement('canvas');
        buffer.width = penguinImage.width;
        buffer.height = penguinImage.height;
        let bx = buffer.getContext('2d');

        // fill offscreen buffer with the tint color
        bx.fillStyle = this.color;
        bx.fillRect(0,0,buffer.width,buffer.height);

        // destination atop makes a result with an alpha channel identical to fg, but with all pixels retaining their original color *as far as I can tell*
        bx.globalCompositeOperation = "destination-atop";
        bx.drawImage(penguinImage,0,0);


        // to tint the image, draw it first
        ctx.drawImage(penguinImage, this.x, this.y);


        //then set the global alpha to the amound that you want to tint it, and draw the buffer directly on top of it.
        ctx.globalAlpha = 0.5;
        ctx.drawImage(buffer, this.x, this.y);

        ctx.globalAlpha = 1;

        ctx.fillStyle = 'black';
        ctx.font = '10px serif';
        ctx.fillText(this.name, this.x + 32, this.y - 12);
        ctx.font = '18px serif';
        ctx.fillText(this.message, this.x + 32, this.y - 50);
    }

    update() {
        if(dist(this.x, this.y, this.targetX, this.targetY) < this.speed) return;

        if(this.x < this.targetX) this.x += this.speed;
        if(this.x > this.targetX) this.x -= this.speed;
        if(this.y < this.targetY) this.y += this.speed;
        if(this.y > this.targetY) this.y -= this.speed;
    }

    setTarget(x,y) {
        this.targetX = x;
        this.targetY = y;
    }
}

let players = {};

canvas.addEventListener('mousedown', function(e) {
    const coords = getCursorPosition(canvas, e);
    const targetX = coords[0];
    const targetY = coords[1];
    socket.emit('playerMoving', playerName, players[playerName].x, players[playerName].y, targetX, targetY);
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chatMessage', input.value, players[playerName].x, players[playerName].y, playerName);
    }
});

socket.on('sendAllPlayers', (serverPlayers, codeName) => {
    if(playerName != codeName) return;

    for(let key in serverPlayers) {
        let newPlayer = serverPlayers[key];
        players[newPlayer.name] = new Player(newPlayer.x, newPlayer.y, newPlayer.name);
    }
});

socket.on('addPlayer', (newPlayer) => {
    players[newPlayer.name] = new Player(newPlayer.x, newPlayer.y, newPlayer.name);
});

socket.on('updatePlayer', (newPlayer) => {
    players[newPlayer.name].x = newPlayer.x;
    players[newPlayer.name].y = newPlayer.x;
    players[newPlayer.name].targetX = newPlayer.targetX;
    players[newPlayer.name].targetY = newPlayer.targetY;
    players[newPlayer.name].message = newPlayer.message;
});

socket.on('deletePlayer', (toDeleteName) => {
    delete players[toDeleteName];
});

socket.on('deletePlayer', (toDeleteName) => {
    delete players[toDeleteName];
});

socket.on('requestPositionUpdate', (name) => {
    if(playerName != name) return;
    socket.emit('playerMoving', playerName, players[playerName].x, players[playerName].y, players[playerName].targetX, players[playerName].targetY);
});

socket.on('removePlayerMessage', (name) => {
    players[name].message = '';
});

function update()
{
    clearCanvas();
    
    for (let key in players)
    {
        let player = players[key];
        player.update();
        player.draw(ctx);
    }
}

setInterval(update, 1000 / 60);