const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');

    let bird;
    let platforms = [];
    let slingshot;
    let score = 0;
    let gameStarted = false;
    let gameLoop;

    class Bird {
      constructor() {
        this.x = 100;
        this.y = canvas.height / 2;
        this.width = 40;
        this.height = 30;
        this.velocity = { x: 0, y: 0 };
        this.gravity = 0.5;
        this.lift = -10;
      }

      draw() {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y);
        ctx.lineTo(this.x + 30, this.y + 5);
        ctx.lineTo(this.x + 20, this.y + 10);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        this.velocity.y += this.gravity;
        this.y += this.velocity.y;
        this.x += this.velocity.x;

        if (this.y + this.height / 2 > canvas.height) {
          this.y = canvas.height - this.height / 2;
          this.velocity.y = 0;
        }

        if (this.x + this.width / 2 > canvas.width || this.x - this.width / 2 < 0) {
          this.velocity.x *= -0.8;
        }
      }

      flap() {
        this.velocity.y = this.lift;
      }
    }

    class Platform {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 20;
      }

      draw() {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Grass effect
        ctx.fillStyle = '#45a049';
        for (let i = 0; i < this.width; i += 5) {
          ctx.fillRect(this.x + i, this.y, 2, 5);
        }
      }
    }

    class Slingshot {
      constructor() {
        this.x = 50;
        this.y = canvas.height - 100;
        this.width = 20;
        this.height = 80;
        this.pulled = false;
        this.pullX = 0;
        this.pullY = 0;
      }

      draw() {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        if (this.pulled) {
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(this.x + this.width / 2, this.y);
          ctx.lineTo(this.pullX, this.pullY);
          ctx.stroke();
        }
      }
    }

    function init() {
      bird = new Bird();
      platforms = [];
      slingshot = new Slingshot();
      score = 0;
      scoreElement.textContent = score;

      for (let i = 0; i < 5; i++) {
        platforms.push(new Platform(Math.random() * (canvas.width - 100), i * 120));
      }
    }

    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clouds
      ctx.fillStyle = 'white';
      drawCloud(100, 100, 50);
      drawCloud(300, 50, 40);
      drawCloud(500, 150, 60);
      drawCloud(700, 80, 45);

      bird.update();
      bird.draw();

      platforms.forEach((platform, index) => {
        platform.draw();

        if (bird.y + bird.height / 2 < platform.y &&
            bird.y + bird.height / 2 + bird.velocity.y >= platform.y &&
            bird.x + bird.width / 2 > platform.x &&
            bird.x - bird.width / 2 < platform.x + platform.width) {
          bird.velocity.y = -10;
          score++;
          scoreElement.textContent = score;
          createParticles(bird.x, bird.y);
        }

        if (platform.y > canvas.height) {
          platforms[index] = new Platform(Math.random() * (canvas.width - 100), 0);
        }

        platform.y += 1;
      });

      slingshot.draw();
      updateParticles();

      requestAnimationFrame(gameLoop);
    }

    function drawCloud(x, y, size) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.arc(x + size, y, size * 0.8, 0, Math.PI * 2);
      ctx.arc(x - size * 0.5, y, size * 0.7, 0, Math.PI * 2);
      ctx.arc(x + size * 0.5, y - size * 0.5, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    let particles = [];

    function createParticles(x, y) {
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: x,
          y: y,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * -5 - 2,
          radius: Math.random() * 3 + 1,
          color: `hsl(${Math.random() * 60 + 180}, 100%, 50%)`,
          life: 30
        });
      }
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
    }

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (mouseX > slingshot.x && mouseX < slingshot.x + slingshot.width &&
          mouseY > slingshot.y && mouseY < slingshot.y + slingshot.height) {
        slingshot.pulled = true;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (slingshot.pulled) {
        const rect = canvas.getBoundingClientRect();
        slingshot.pullX = e.clientX - rect.left;
        slingshot.pullY = e.clientY - rect.top;
      }
    });

    canvas.addEventListener('mouseup', () => {
      if (slingshot.pulled) {
        const power = Math.sqrt(Math.pow(slingshot.pullX - slingshot.x, 2) + Math.pow(slingshot.pullY - slingshot.y, 2)) / 10;
        const angle = Math.atan2(slingshot.pullY - slingshot.y, slingshot.pullX - slingshot.x);
        
        bird.x = slingshot.x;
        bird.y = slingshot.y;
        bird.velocity.x = Math.cos(angle) * power;
        bird.velocity.y = Math.sin(angle) * power;

        slingshot.pulled = false;
      } else {
        bird.flap();
      }
    });

    startButton.addEventListener('click', () => {
      if (!gameStarted) {
        gameStarted = true;
        startScreen.style.display = 'none';
        init();
        gameLoop();
      }
    });

    // Touch events for mobile devices
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      if (touchX > slingshot.x && touchX < slingshot.x + slingshot.width &&
          touchY > slingshot.y && touchY < slingshot.y + slingshot.height) {
        slingshot.pulled = true;
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (slingshot.pulled) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        slingshot.pullX = touch.clientX - rect.left;
        slingshot.pullY = touch.clientY - rect.top;
      }
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (slingshot.pulled) {
        const power = Math.sqrt(Math.pow(slingshot.pullX - slingshot.x, 2) + Math.pow(slingshot.pullY - slingshot.y, 2)) / 10;
        const angle = Math.atan2(slingshot.pullY - slingshot.y, slingshot.pullX - slingshot.x);
        
        bird.x = slingshot.x;
        bird.y = slingshot.y;
        bird.velocity.x = Math.cos(angle) * power;
        bird.velocity.y = Math.sin(angle) * power;

        slingshot.pulled = false;
      } else {
        bird.flap();
      }
    });

    init();