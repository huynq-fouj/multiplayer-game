let usernameForm = document.querySelector('.username-input-container');
usernameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  usernameForm.style.display = 'none'
  usernameForm.classList.remove('active');
  const usernameInput = document.querySelector('#usernameInput');
  socket.emit('join-game', {
    width: canvas.width,
    height: canvas.height,
    devicePixelRatio,
    username: usernameInput.value ? usernameInput.value : 'No name'
  });
  document.querySelector('.leaderboard-container').style.display = 'block';
});