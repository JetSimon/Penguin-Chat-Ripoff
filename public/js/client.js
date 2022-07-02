let socket = io();
let playerName;

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

        for(let i = 0; i < this.name.length; i++) {
            let c = this.name[i];
            this.color += (i + c.charCodeAt());
        }

        this.color = '#' + this.color.toString(16);
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 64, 64);
        ctx.fillStyle = 'black';
        ctx.fillText(this.name, this.x, this.y - 15);
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

ctx.font = '18px serif';

let players = {};

canvas.addEventListener('mousedown', function(e) {
    const coords = getCursorPosition(canvas, e);
    const targetX = coords[0];
    const targetY = coords[1];
    socket.emit('playerMoving', playerName, players[playerName].x, players[playerName].y, targetX, targetY);
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
});

socket.on('deletePlayer', (toDeleteName) => {
    delete players[toDeleteName];
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