let scene, camera, renderer, bird, platforms = [], score = 0;
    const scoreElement = document.getElementById('score');
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');

    function init() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.getElementById('gameCanvas').appendChild(renderer.domElement);

      // Skybox
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
        'https://threejsfundamentals.org/threejs/resources/images/skybox/px.jpg',
        'https://threejsfundamentals.org/threejs/resources/images/skybox/nx.jpg',
        'https://threejsfundamentals.org/threejs/resources/images/skybox/py.jpg',
        'https://threejsfundamentals.org/threejs/resources/images/skybox/ny.jpg',
        'https://threejsfundamentals.org/threejs/resources/images/skybox/pz.jpg',
        'https://threejsfundamentals.org/threejs/resources/images/skybox/nz.jpg',
      ]);
      scene.background = texture;

      // Bird
      const birdGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const birdMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6B6B });
      bird = new THREE.Mesh(birdGeometry, birdMaterial);
      bird.position.set(0, 0, -5);
      scene.add(bird);

      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(0.1, 32, 32);
      const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(0.3, 0.2, 0.4);
      rightEye.position.set(-0.3, 0.2, 0.4);
      bird.add(leftEye);
      bird.add(rightEye);

      // Beak
      const beakGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
      const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xFFA500 });
      const beak = new THREE.Mesh(beakGeometry, beakMaterial);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0, 0.6);
      bird.add(beak);

      // Platforms
      for (let i = 0; i < 5; i++) {
        createPlatform();
      }

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
      directionalLight.position.set(0, 1, 1);
      scene.add(directionalLight);

      camera.position.z = 5;
    }

    function createPlatform() {
      const platformGeometry = new THREE.BoxGeometry(3, 0.5, 2);
      const platformMaterial = new THREE.MeshPhongMaterial({ color: 0x4CAF50 });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        -(Math.random() * 10 + 10)
      );
      scene.add(platform);
      platforms.push(platform);
    }

    function animate() {
      requestAnimationFrame(animate);

      bird.position.y -= 0.05; // Gravity
      bird.rotation.x += 0.05; // Bird rotation

      // Move platforms
      platforms.forEach((platform, index) => {
        platform.position.z += 0.1;
        if (platform.position.z > 5) {
          scene.remove(platform);
          platforms.splice(index, 1);
          createPlatform();
        }

        // Collision detection
        if (bird.position.distanceTo(platform.position) < 1.5) {
          bird.position.y = platform.position.y + 1;
          score++;
          scoreElement.textContent = score;
        }
      });

      // Game over condition
      if (bird.position.y < -10) {
        alert('Game Over! Your score: ' + score);
        resetGame();
      }

      renderer.render(scene, camera);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function resetGame() {
      bird.position.set(0, 0, -5);
      bird.rotation.set(0, 0, 0);
      platforms.forEach(platform => scene.remove(platform));
      platforms = [];
      for (let i = 0; i < 5; i++) {
        createPlatform();
      }
      score = 0;
      scoreElement.textContent = score;
    }

    window.addEventListener('resize', onWindowResize, false);

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        bird.position.y += 1;
        bird.rotation.x = -0.5;
      }
    });

    document.addEventListener('click', () => {
      bird.position.y += 1;
      bird.rotation.x = -0.5;
    });

    startButton.addEventListener('click', () => {
      startScreen.style.display = 'none';
      init();
      animate();
    });