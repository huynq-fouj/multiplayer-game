import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const PORT = 8080;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  pingInterval: 2000,
  pingTimeout: 5000
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
});

const SPEED = 5;
const RADIUS = 14;
const P_RADIUS = 5;
let projectileId = 0;
const canvasWidth = 1024;
const canvasHeight = 576;

const players = {};
const projectiles = {};

io.on('connection', socket => {

  socket.on('join-game', data => {
    //Create new player
    players[socket.id] = {
      x: 500 * Math.random(),
      y: 500 * Math.random(),
      radius: RADIUS,
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username: data.username
    };
    //Init canvas
    players[socket.id].canvas = {
      width: data.width,
      height: data.height
    };

    io.emit('update-players', players);
  });

  socket.on('keydown', ({keycode, sequenceNumber}) => {
    if(!players[socket.id]) return;
    const player = players[socket.id];
    player.sequenceNumber = sequenceNumber;
    switch(keycode) {
      case 'KeyA':
        player.x -= SPEED;
        break;
      case 'KeyS':
        player.y += SPEED;
        break;
      case 'KeyD':
        player.x += SPEED;
        break;
      case 'KeyW':
        player.y -= SPEED;
        break;
    }

    const playerSides = {
      left: player.x - player.radius,
      right: player.x + player.radius,
      top: player.y - player.radius,
      bottom: player.y + player.radius
    };

    if (playerSides.left < 0) players[socket.id].x = player.radius;
    if (playerSides.right > canvasWidth) players[socket.id].x = canvasWidth - player.radius;
    if (playerSides.top < 0) players[socket.id].y = player.radius;
    if (playerSides.bottom > canvasHeight) players[socket.id].y = canvasHeight - player.radius;
  });

  socket.on('shoot', ({ x, y, angle }) => {
    projectileId++;
    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    };

    projectiles[projectileId] = {
      x,
      y,
      velocity,
      playerId: socket.id
    }
  });

  socket.on('disconnect', reason => {
    delete players[socket.id];
    io.emit('update-players', players);
  });
});

//Update players
setInterval(() => {
  for (const id in projectiles) {
    //Update projectile position
    projectiles[id].x += projectiles[id].velocity.x;
    projectiles[id].y += projectiles[id].velocity.y;
    //
    if (
      projectiles[id].x - P_RADIUS >=
        players[projectiles[id].playerId]?.canvas?.width ||
      projectiles[id].x + P_RADIUS <= 0 ||
      projectiles[id].y - P_RADIUS >=
        players[projectiles[id].playerId]?.canvas?.height ||
      projectiles[id].y + P_RADIUS <= 0
    ) {
      delete projectiles[id];
      continue;
    }

    for (const playerId in players) {
      const player = players[playerId];
      const DISTANCE = Math.hypot(
        projectiles[id].x - player.x,
        projectiles[id].y - player.y
      )

      //Collision detection
      if (
        DISTANCE < P_RADIUS + player.radius &&
        projectiles[id].playerId !== playerId
      ) {
        if (players[projectiles[id].playerId]) players[projectiles[id].playerId].score++;
        
        delete projectiles[id];
        delete players[playerId];
        break;
      }
    }

  }

  io.emit('update-projectiles', projectiles);
  io.emit('update-players', players);
}, 15);// FPS = 1000 / 15

//
server.listen(PORT, () => {
  console.log(`Server run on: http://localhost:8080`);
});