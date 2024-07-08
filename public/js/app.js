const tile = new Image();
tile.src = '../images/tile.png';
const tileSize = {
  width: 328 / 2,
  height: 368 / 2
}
const mapWidth = tileSize.width * 15;
const mapHeight = tileSize.height * 6;

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
c.scale(devicePixelRatio, devicePixelRatio);

const x = canvas.width / 2;
const y = canvas.height / 2;


const players = {};
const projectiles = {};

const socket = io();

//
socket.on('update-players', data => {
  for(const id in data) {
    const player = data[id];
    if(!players[id]) {
      players[id] = new Player({
        x: player.x,
        y: player.y,
        radius: player.radius,
        color: player.color,
        username: player.username
      });

      //Init player labels
      document.querySelector('#playerLabels').innerHTML += `<div data-id="${id}" data-score="${player.score}">${player.username}: ${player.score}</div>`
    } else {

      sortedPlayerScore(id, player);

      gsap.to(players[id], {
        x: player.x,
        y: player.y,
        duration: 0.015,
        ease: 'linear'
      });

      if(id == socket.id) {
        const lastInput = playerInputs.findIndex(input => player.sequenceNumber === input.sequenceNumber);
        if(lastInput > -1) playerInputs.splice(0, lastInput + 1);
        playerInputs.forEach(input => {
          players[id].x += input.dx;
          players[id].y += input.dy;
        });
      }
    }
  }

  for(const id in players) {
    if(!data[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`);
      divToDelete.parentNode.removeChild(divToDelete);
      if (id === socket.id) {
        document.querySelector('.leaderboard-container').style.display = 'none';
        document.querySelector('.username-input-container').style.display = 'flex';
        document.querySelector('.username-input-container').classList.add('active');
      }

      delete players[id];
    }
  }
});

//
socket.on('update-projectiles', data => {
  for (const id in data) {
    const projectile = data[id];
    if (!projectiles[id]) {
      projectiles[id] = new Projectile({
        x: projectile.x,
        y: projectile.y,
        radius: 5,
        color: players[projectile.playerId]?.color,
        velocity: projectile.velocity
      });
    } else {
      projectiles[id].x += projectile.velocity.x;
      projectiles[id].y += projectile.velocity.y;
    }
  }

  for (const projectileId in projectiles) {
    if (!data[projectileId]) {
      delete projectiles[projectileId];
    }
  }
});


const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  focus: player => {
    camera.x = player.x + player.radius - camera.width / 2;
    camera.y = player.y + player.radius - camera.height / 2;
    camera.x = Math.max(0, Math.min(mapWidth - camera.width, camera.x));
    camera.y = Math.max(0, Math.min(mapHeight - camera.height, camera.y));
  }
}

const drawMap = (ctx, camera) => {
  for (let row = 0; row < mapHeight / tileSize.height; row++) {
    for (let col = 0; col < mapWidth / tileSize.width; col++) {
      ctx.drawImage(tile, col * tileSize.width - camera.x, row * tileSize.height - camera.y, tileSize.width, tileSize.height);
    }
  }
}

//Update frame
let animationId;
function animate() {
  animationId = requestAnimationFrame(animate);
  if(players[socket.id]) {
    camera.focus(players[socket.id]);
  }
  c.clearRect(0, 0, canvas.width, canvas.height);
  drawMap(c, camera);
  for (const id in players) players[id].draw(camera);
  for (const id in projectiles) projectiles[id].draw(camera);
}

animate();

const keys = {
    w: {
      pressed: false
    },
    a: {
      pressed: false
    },
    s: {
      pressed: false
    },
    d: {
      pressed: false
    }
};

//Handle player movements
const SPEED = 5;
const playerInputs = [];
let sequenceNumber = 0;
setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED });
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber });
  }

  if (keys.a.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 });
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber });
  }

  if (keys.s.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED });
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber });
  }

  if (keys.d.pressed) {
    sequenceNumber++;
    playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 });
    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber });
  }
}, 15);

window.addEventListener('keydown', (event) => {
  if (!players[socket.id]) return;

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true;
      break;

    case 'KeyA':
      keys.a.pressed = true;
      break;

    case 'KeyS':
      keys.s.pressed = true;
      break;

    case 'KeyD':
      keys.d.pressed = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  if (!players[socket.id]) return;

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false;
      break;

    case 'KeyA':
      keys.a.pressed = false;
      break;

    case 'KeyS':
      keys.s.pressed = false;
      break;

    case 'KeyD':
      keys.d.pressed = false;
      break;
  }
});

//Event shoot
addEventListener('click', (event) => {
  if(!players[socket.id]) return;
  const canvas = document.querySelector('canvas');
  const { top, left } = canvas.getBoundingClientRect();
  
  const playerPosition = {
    x: players[socket.id].x,
    y: players[socket.id].y
  };

  const mouseX = event.clientX - left;
  const mouseY = event.clientY - top;

  const dx = mouseX + camera.x - playerPosition.x;
  const dy = mouseY + camera.y - playerPosition.y;

  const angle = Math.atan2(dy, dx);

  socket.emit('shoot', angle);
});

const sortedPlayerScore = (id, player) => {
  const playerLabel = document.querySelector(`div[data-id="${id}"]`);
  playerLabel.innerHTML = `${player.username}: ${player.score}`;
  playerLabel.setAttribute('data-score', player.score);

  //Sorts the players divs
  const parentDiv = document.querySelector('#playerLabels');
  const childDivs = Array.from(parentDiv.querySelectorAll('div'));

  childDivs.sort((a, b) => {
    const scoreA = Number(a.getAttribute('data-score'));
    const scoreB = Number(b.getAttribute('data-score'));
    return scoreB - scoreA;
  });

  //Removes old elements
  childDivs.forEach((div) => {
    parentDiv.removeChild(div);
  });

  //Adds sorted elements
  childDivs.forEach((div) => {
    parentDiv.appendChild(div);
  });
}