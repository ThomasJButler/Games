const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');

let snake = [{x: 10, y: 10}];
let direction = 'right';
let food = {};
let score = 0;
let gameLoop;
let powerPellet = {};
let isPoweredUp = false;
let ghosts = [
  {name: 'blinky', x: 0, y: 0, direction: 'right'},
  {name: 'pinky', x: 29, y: 0, direction: 'left'},
  {name: 'inky', x: 0, y: 29, direction: 'up'},
  {name: 'clyde', x: 29, y: 29, direction: 'down'}
];

function drawSnake() {
  snake.forEach((segment, index) => {
    if (index === 0) {
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(segment.x * 20 + 10, segment.y * 20 + 10, 10, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(segment.x * 20, segment.y * 20, 20, 20);
    }
  });
}

function drawFood() {
  ctx.fillStyle = '#00FFFF';
  ctx.beginPath();
  ctx.arc(food.x * 20 + 10, food.y * 20 + 10, 5, 0, 2 * Math.PI);
  ctx.fill();
}

function drawPowerPellet() {
  if (powerPellet.x !== undefined) {
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(powerPellet.x * 20 + 10, powerPellet.y * 20 + 10, 8, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function drawGhosts() {
  ghosts.forEach(ghost => {
    const ghostElement = document.getElementById(ghost.name);
    ghostElement.style.left = `${ghost.x * 20 + canvas.offsetLeft}px`;
    ghostElement.style.top = `${ghost.y * 20 + canvas.offsetTop}px`;
    ghostElement.style.filter = isPoweredUp ? 'brightness(50%)' : 'none';
  });
}

function moveSnake() {
  const head = {x: snake[0].x, y: snake[0].y};
  switch(direction) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  if (head.x < 0) head.x = 29;
  if (head.x > 29) head.x = 0;
  if (head.y < 0) head.y = 29;
  if (head.y > 29) head.y = 0;
  
  snake.unshift(head);
  
  if (head.x === food.x && head.y === food.y) {
    generateFood();
    score += 10;
    scoreElement.textContent = score;
  } else {
    snake.pop();
  }
  
  if (head.x === powerPellet.x && head.y === powerPellet.y) {
    activatePowerUp();
  }
}

function moveGhosts() {
  ghosts.forEach(ghost => {
    const directions = ['up', 'down', 'left', 'right'];
    if (Math.random() < 0.2) {
      ghost.direction = directions[Math.floor(Math.random() * directions.length)];
    }
    
    switch(ghost.direction) {
      case 'up': ghost.y--; break;
      case 'down': ghost.y++; break;
      case 'left': ghost.x--; break;
      case 'right': ghost.x++; break;
    }
    
    if (ghost.x < 0) ghost.x = 29;
    if (ghost.x > 29) ghost.x = 0;
    if (ghost.y < 0) ghost.y = 29;
    if (ghost.y > 29) ghost.y = 0;
    
    if (ghost.x === snake[0].x && ghost.y === snake[0].y) {
      if (isPoweredUp) {
        score += 200;
        scoreElement.textContent = score;
        resetGhost(ghost);
      } else {
        gameOver();
      }
    }
  });
}

function resetGhost(ghost) {
  switch(ghost.name) {
    case 'blinky': ghost.x = 0; ghost.y = 0; break;
    case 'pinky': ghost.x = 29; ghost.y = 0; break;
    case 'inky': ghost.x = 0; ghost.y = 29; break;
    case 'clyde': ghost.x = 29; ghost.y = 29; break;
  }
}

function generateFood() {
  food = {
    x: Math.floor(Math.random() * 30),
    y: Math.floor(Math.random() * 30)
  };
}

function generatePowerPellet() {
  powerPellet = {
    x: Math.floor(Math.random() * 30),
    y: Math.floor(Math.random() * 30)
  };
}

function activatePowerUp() {
  isPoweredUp = true;
  powerPellet = {};
  setTimeout(() => {
    isPoweredUp = false;
  }, 10000);
}

function gameOver() {
  clearInterval(gameLoop);
  ctx.fillStyle = '#FF0000';
  ctx.font = '40px "Press Start 2P"';
  ctx.fillText('GAME OVER', 120, 300);
  startButton.style.display = 'block';
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  moveSnake();
  moveGhosts();
  drawSnake();
  drawFood();
  drawPowerPellet();
  drawGhosts();
  
  if (Math.random() < 0.005 && powerPellet.x === undefined) {
    generatePowerPellet();
  }
}

startButton.addEventListener('click', () => {
  snake = [{x: 10, y: 10}];
  direction = 'right';
  score = 0;
  scoreElement.textContent = score;
  generateFood();
  generatePowerPellet();
  ghosts.forEach(resetGhost);
  startButton.style.display = 'none';
  gameLoop = setInterval(gameLoop, 100);
});

document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowUp': if (direction !== 'down') direction = 'up'; break;
    case 'ArrowDown': if (direction !== 'up') direction = 'down'; break;
    case 'ArrowLeft': if (direction !== 'right') direction = 'left'; break;
    case 'ArrowRight': if (direction !== 'left') direction = 'right'; break;
  }
});