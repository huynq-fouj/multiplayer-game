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
  res.sendFile(__dirname + '/index.html');
});

const SPEED = 5;
const P_SPEED = 6;
const RADIUS = 14;
const P_RADIUS = 5;
let projectileId = 0;
const tileSize = {
  width: 328 / 2,
  height: 368 / 2
}
const mapWidth = tileSize.width * 15;
const mapHeight = tileSize.height * 6;

const players = {};
const projectiles = {};

io.on('connection', socket => {

  socket.on('join-game', data => {
    //Create new player
    players[socket.id] = {
      x: mapWidth * Math.random(),
      y: mapHeight * Math.random(),
      radius: RADIUS,
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username: data.username
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
    if (playerSides.right > mapWidth) players[socket.id].x = mapWidth - player.radius;
    if (playerSides.top < 0) players[socket.id].y = player.radius;
    if (playerSides.bottom > mapHeight) players[socket.id].y = mapHeight - player.radius;
  });

  socket.on('shoot', (angle) => {
    const player = players[socket.id];
    projectileId++;
    const velocity = {
      x: Math.cos(angle) * P_SPEED,
      y: Math.sin(angle) * P_SPEED
    };
    //New projectile
    projectiles[projectileId] = {
      x: player.x,
      y: player.y,
      velocity,
      playerId: socket.id,
      timeLeft: 3000
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    for(const id in projectiles) {
      if(projectiles[id].playerId === socket.id) delete projectiles[id];
    }
    io.emit('update-players', players);
  });
});

let lastUpdate = Date.now();
setInterval(() => {
  const now = Date.now();
  const delta = now - lastUpdate;
  for (const id in projectiles) {
    //Update projectile position
    projectiles[id].x += projectiles[id].velocity.x;
    projectiles[id].y += projectiles[id].velocity.y;
    //Update timeLeft
    projectiles[id].timeLeft -= delta
    //Check timeLeft
    if (projectiles[id].timeLeft <= 0) {
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
  lastUpdate = now;
}, 20);// FPS = 1000 / 20

//
server.listen(PORT, () => {
  console.log(`Server run on: http://localhost:8080`);
});