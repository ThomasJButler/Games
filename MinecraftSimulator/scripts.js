// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Create floor
const floorGeometry = new THREE.BoxGeometry(1, 1, 1);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x3cb80b });
const floor = new THREE.Group();

for (let x = -25; x < 25; x++) {
    for (let z = -25; z < 25; z++) {
        const cube = new THREE.Mesh(floorGeometry, floorMaterial.clone());
        cube.position.set(x, -0.5, z);
        cube.receiveShadow = true;
        floor.add(cube);
    }
}

scene.add(floor);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(0, 100, 0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

// Add sky
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide });
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// Add clouds
const cloudGeometry = new THREE.SphereGeometry(2, 32, 32);
const cloudMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.7 });
const clouds = new THREE.Group();

for (let i = 0; i < 20; i++) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(
        Math.random() * 100 - 50,
        Math.random() * 10 + 20,
        Math.random() * 100 - 50
    );
    cloud.scale.set(Math.random() + 1, 0.5, Math.random() + 1);
    clouds.add(cloud);
}

scene.add(clouds);

// Add sun
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 100, 0);
scene.add(sun);

// Player physics
const player = {
    height: 1.8,
    radius: 0.3,
    position: new THREE.Vector3(0, 1, 0),
    velocity: new THREE.Vector3(),
    onGround: false,
    jumping: false
};

// Set up camera position
camera.position.y = player.height;

// Raycaster for block selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);

// Movement variables
const moveSpeed = 0.1;
const gravity = -9.8;
const jumpForce = 5;
const keys = { w: false, a: false, s: false, d: false, ' ': false };

// Hand model
const handGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
const handMaterial = new THREE.MeshBasicMaterial({ color: 0xffccaa });
const hand = new THREE.Mesh(handGeometry, handMaterial);
hand.position.set(0.3, -0.3, -0.5);
camera.add(hand);

// Block in hand
const blockInHand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
blockInHand.position.set(0, 0, -0.3);
hand.add(blockInHand);

scene.add(camera);

// HUD visibility
let hudVisible = true;
let logVisible = true;

document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() in keys) {
        keys[event.key.toLowerCase()] = true;
    }
    if (event.key === 'h') {
        hudVisible = !hudVisible;
        logVisible = !logVisible;
        document.getElementById('info').style.display = hudVisible ? 'block' : 'none';
        document.getElementById('log').style.display = logVisible ? 'block' : 'none';
        document.getElementById('timeButtons').style.display = hudVisible ? 'flex' : 'none';
        document.getElementById('saveLoadButtons').style.display = hudVisible ? 'flex' : 'none';
    }
    if (event.key === 'r') {
        respawnPlayer();
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() in keys) {
        keys[event.key.toLowerCase()] = false;
    }
});

// Mouse look
let pitch = 0;
let yaw = 0;

document.addEventListener('mousemove', (event) => {
    const sensitivity = 0.002;
    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
});

// Lock pointer
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

// FPS counter
let frames = 0;
let lastTime = performance.now();
let fps = 0;

function updateFPS() {
    const now = performance.now();
    frames++;
    if (now - lastTime >= 1000) {
        fps = frames;
        frames = 0;
        lastTime = now;
    }
}

// Hotbar
const hotbar = document.getElementById('hotbar');
let activeHotbarSlot = 0;
const blockTypes = [
    { name: 'Grass', color: 0x3cb80b, id: 1 },
    { name: 'Dirt', color: 0x59311a, id: 2 },
    { name: 'Wood', color: 0x876958, id: 3 },
    { name: 'Cobblestone', color: 0x5c5c5c, id: 4 },
    { name: 'Diamond', color: 0x47fff9, id: 5 },
    { name: 'Wool', color: 0xd4d6d6, id: 6 },
    { name: 'Torch', color: 0xffa500, id: 7, isLight: true }
];

// Create 3D cubes for hotbar
const hotbarCubes = [];
for (let i = 0; i < 9; i++) {
    const slot = document.createElement('div');
    slot.className = 'hotbar-slot';
    if (i === 0) slot.classList.add('active');
    
    if (i < blockTypes.length) {
        const miniRenderer = new THREE.WebGLRenderer({ alpha: true });
        miniRenderer.setSize(40, 40);
        const miniScene = new THREE.Scene();
        const miniCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
        miniCamera.position.z = 2;

        let cube;
        if (blockTypes[i].name === 'Torch') {
            const torchGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
            const torchMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            cube = new THREE.Mesh(torchGeometry, torchMaterial);

            const flameGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.y = 0.3;
            cube.add(flame);
        } else {
            cube = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshPhongMaterial({ color: blockTypes[i].color })
            );
        }
        miniScene.add(cube);

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        miniScene.add(light);

        miniScene.add(new THREE.AmbientLight(0x404040));

        slot.appendChild(miniRenderer.domElement);
        hotbarCubes.push({ cube, miniRenderer, miniScene, miniCamera });
    }
    
    hotbar.appendChild(slot);
}

document.addEventListener('keydown', (event) => {
    const key = parseInt(event.key);
    if (key >= 1 && key <= 9) {
        document.querySelectorAll('.hotbar-slot').forEach((slot, index) => {
            slot.classList.toggle('active', index === key - 1);
        });
        activeHotbarSlot = key - 1;
        updateBlockInHand();
    }
});

function updateBlockInHand() {
    if (activeHotbarSlot < blockTypes.length) {
        const blockType = blockTypes[activeHotbarSlot];
        if (blockType.name === 'Torch') {
            blockInHand.geometry = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8);
            const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), flameMaterial);
            flame.position.y = 0.15;
            blockInHand.add(flame);
        } else {
            blockInHand.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            blockInHand.children = [];
        }
        blockInHand.material.color.setHex(blockType.color);
        blockInHand.visible = true;
    } else {
        blockInHand.visible = false;
    }
}

function checkCollision(position) {
    for (const cube of floor.children) {
        const dx = Math.abs(position.x - cube.position.x);
        const dy = Math.abs(position.y - cube.position.y);
        const dz = Math.abs(position.z - cube.position.z);

        if (dx < (player.radius + 0.5) && dy < (player.height / 2 + 0.5) && dz < (player.radius + 0.5)){
            return true;
        }
    }
    return false;
}

function updatePlayer(delta) {
    // Apply gravity
    player.velocity.y += gravity * delta;

    // Check if player is on ground
    player.onGround = checkCollision(player.position.clone().add(new THREE.Vector3(0, -player.height / 2 - 0.1, 0)));

    if (player.onGround) {
        player.velocity.y = Math.max(0, player.velocity.y);
        if (keys[' '] && !player.jumping) {
            player.velocity.y = jumpForce;
            player.jumping = true;
        }
    } else {
        player.jumping = false;
    }

    // Apply movement
    const moveDirection = new THREE.Vector3();
    if (keys.s) moveDirection.z += 1;
    if (keys.w) moveDirection.z -= 1;
    if (keys.a) moveDirection.x -= 1;
    if (keys.d) moveDirection.x += 1;
    moveDirection.normalize().multiplyScalar(moveSpeed);

    moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

    const newPosition = player.position.clone()
        .add(moveDirection)
        .add(player.velocity.clone().multiplyScalar(delta));

    // Check collision and update position
    if (!checkCollision(newPosition)) {
        player.position.copy(newPosition);
    } else {
        // Simple sliding along walls
        if (!checkCollision(new THREE.Vector3(newPosition.x, player.position.y, player.position.z))) {
            player.position.x = newPosition.x;
        }
        if (!checkCollision(new THREE.Vector3(player.position.x, newPosition.y, player.position.z))) {
            player.position.y = newPosition.y;
        }
        if (!checkCollision(new THREE.Vector3(player.position.x, player.position.y, newPosition.z))) {
            player.position.z = newPosition.z;
        }
    }

    // Update camera position
    camera.position.copy(player.position);
    camera.position.y += player.height;
}

function addLogMessage(message) {
    const logElement = document.getElementById('log');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    logElement.appendChild(messageElement);

    // Limit log to last 10 messages
    while(logElement.children.length > 10) {
        logElement.removeChild(logElement.firstChild);
    }
}

function breakBlock() {
    const intersects = raycaster.intersectObjects(floor.children);
    if (intersects.length > 0) {
        const block = intersects[0].object;
        const position = block.position;
        floor.remove(block);
        const timestamp = new Date().toLocaleString();
        addLogMessage(`Block broken at (${position.x}, ${position.y}, ${position.z}) - ${timestamp}`);
    }
}

function placeBlock() {
    const intersects = raycaster.intersectObjects(floor.children);
    if (intersects.length > 0) {
        const intersectedBlock = intersects[0].object;
        const normal = intersects[0].face.normal;
        const position = intersectedBlock.position.clone().add(normal);
        
        if (activeHotbarSlot < blockTypes.length) {
            const blockType = blockTypes[activeHotbarSlot];
            let newBlock;
            
            if (blockType.name === 'Torch') {
                const torchGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
                const torchMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
                newBlock = new THREE.Mesh(torchGeometry, torchMaterial);

                const flameGeometry = new THREE.SphereGeometry(0.15, 8, 8);
                const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
                const flame = new THREE.Mesh(flameGeometry, flameMaterial);
                flame.position.y = 0.3;
                newBlock.add(flame);

                const torchLight = new THREE.PointLight(0xFFA500, 1, 10);
                torchLight.position.set(0, 0.5, 0);
                newBlock.add(torchLight);
            } else {
                newBlock = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshPhongMaterial({ color: blockType.color })
                );
            }

            newBlock.position.copy(position);
            newBlock.receiveShadow = true;
            newBlock.userData.blockType = blockType.id;
            floor.add(newBlock);
            
            const timestamp = new Date().toLocaleString();
            addLogMessage(`${blockType.name} block placed at (${position.x}, ${position.y}, ${position.z}) - ${timestamp}`);
        }
    }
}

function respawnPlayer() {
    player.position.set(0, 1, 0);
    player.velocity.set(0, 0, 0);
    const timestamp = new Date().toLocaleString();
    addLogMessage(`Player respawned at spawn - ${timestamp}`);
}

document.addEventListener('mousedown', (event) => {
    if (document.pointerLockElement === renderer.domElement) {
        if (event.button === 0) { // Left click
            breakBlock();
        } else if (event.button === 2) { // Right click
            placeBlock();
        }
    }
});

document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Day/Night cycle
let gameTime = 6.5 * 60; // Start at 6:30
const day = 24 * 60; // 24 hours in minutes

function updateDayNightCycle(delta) {
    gameTime += delta * 2.2; // 2.2 times faster than real-time
    if (gameTime >= day) {
        gameTime -= day;
    }

    const hour = Math.floor(gameTime / 60);
    const minute = Math.floor(gameTime % 60);

    // Update sun position
    const sunAngle = (gameTime / day) * Math.PI * 2 - Math.PI / 2;
    sun.position.x = Math.cos(sunAngle) * 100;
    sun.position.y = Math.sin(sunAngle) * 100;

    // Update directional light
    directionalLight.position.copy(sun.position);

    // Update sky color
    let skyColor, lightIntensity, ambientIntensity;

    if (gameTime >= 5.5 * 60 && gameTime < 6.5 * 60) { // Morning
        skyColor = new THREE.Color(0xFFA07A);
        lightIntensity = 0.5;
        ambientIntensity = 0.3;
    } else if (gameTime >= 6.5 * 60 && gameTime < 17 * 60) { // Day
        skyColor = new THREE.Color(0x87CEEB);
        lightIntensity = 0.7;
        ambientIntensity = 0.5;
    } else if (gameTime >= 17 * 60 && gameTime < 20.33 * 60) { // Evening
        skyColor = new THREE.Color(0xFFA500);
        lightIntensity = 0.5;
        ambientIntensity = 0.3;
    } else if (gameTime >= 20.33 * 60 && gameTime < 20.67 * 60) { // Sunset
        skyColor = new THREE.Color(0xFF4500);
        lightIntensity = 0.3;
        ambientIntensity = 0.2;
    } else { // Night
        skyColor = new THREE.Color(0x191970);
        lightIntensity = 0.1;
        ambientIntensity = 0.1;
    }

    sky.material.color.copy(skyColor);
    directionalLight.intensity = lightIntensity;
    ambientLight.intensity = ambientIntensity;

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Time buttons functionality
document.querySelectorAll('.timeButton').forEach(button => {
    button.addEventListener('click', () => {
        const [hours, minutes] = button.dataset.time.split(':').map(Number);
        gameTime = hours * 60 + minutes;
    });
});

// Save and Load World functionality
const saveWorldButton = document.getElementById('saveWorldButton');
const loadWorldButton = document.getElementById('loadWorldButton');
const worldDataModal = document.getElementById('worldDataModal');
const worldDataTextarea = document.getElementById('worldDataTextarea');
const confirmLoadButton = document.getElementById('confirmLoadButton');
const closeModalButton = document.querySelector('.close');

saveWorldButton.addEventListener('click', saveWorld);
loadWorldButton.addEventListener('click', () => worldDataModal.style.display = 'block');
confirmLoadButton.addEventListener('click', loadWorld);
closeModalButton.addEventListener('click', () => worldDataModal.style.display = 'none');

function saveWorld() {
    const worldData = [];
    floor.children.forEach(block => {
        if (block.userData.blockType) {
            worldData.push(`${block.userData.blockType},${block.position.x},${block.position.y},${block.position.z}`);
        }
    });
    const worldDataString = worldData.join(';');
    worldDataTextarea.value = worldDataString;
    worldDataModal.style.display = 'block';
}

function loadWorld() {
    const worldDataString = worldDataTextarea.value;
    const worldData = worldDataString.split(';');

    // Clear existing blocks
    floor.children = floor.children.filter(child => !child.userData.blockType);

    worldData.forEach(blockData => {
        const [typeId, x, y, z] = blockData.split(',').map(Number);
        const blockType = blockTypes.find(type => type.id === typeId);
        
        if (blockType) {
            let newBlock;
            
            if (blockType.name === 'Torch') {
                const torchGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
                const torchMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
                newBlock = new THREE.Mesh(torchGeometry, torchMaterial);

                const flameGeometry = new THREE.SphereGeometry(0.15, 8, 8);
                const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
                const flame = new THREE.Mesh(flameGeometry, flameMaterial);
                flame.position.y = 0.3;
                newBlock.add(flame);

                const torchLight = new THREE.PointLight(0xFFA500, 1, 10);
                torchLight.position.set(0, 0.5, 0);
                newBlock.add(torchLight);
            } else {
                newBlock = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 1, 1),
                    new THREE.MeshPhongMaterial({ color: blockType.color })
                );
            }

            newBlock.position.set(x, y, z);
            newBlock.receiveShadow = true;
            newBlock.userData.blockType = blockType.id;
            floor.add(newBlock);
        }
    });

    worldDataModal.style.display = 'none';
}

function animate() {
    requestAnimationFrame(animate);

    const delta = 1 / 60; // Assume 60 FPS for simplicity

    updatePlayer(delta);

    // Camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Raycasting
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(floor.children);

    // Reset all block colors
    floor.children.forEach(cube => {
        if (cube.material.emissive) {
            cube.material.emissive.setHex(0x000000);
        }
    });

    let pointingInfo = 'Pointing At Block: None';
    let faceInfo = 'Face: None';

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        if (intersectedObject.material.emissive) {
            intersectedObject.material.emissive.setHex(0x666666);
        }

        const blockPosition = intersectedObject.position;
        pointingInfo = `Pointing At Block: X:${blockPosition.x.toFixed(0)} Y:${blockPosition.y.toFixed(0)} Z:${blockPosition.z.toFixed(0)}`;

        const face = intersects[0].face;
        if (face.normal.y === 1) faceInfo = 'Face: Top';
        else if (face.normal.y === -1) faceInfo = 'Face: Bottom';
        else if (face.normal.x === 1) faceInfo = 'Face: East';
        else if (face.normal.x === -1) faceInfo = 'Face: West';
        else if (face.normal.z === 1) faceInfo = 'Face: South';
        else if (face.normal.z === -1) faceInfo = 'Face: North';
    }

    // Update FPS
    updateFPS();

    // Update day/night cycle
    const currentTime = updateDayNightCycle(delta);

    // Update info display
    if (hudVisible) {
        document.getElementById('info').innerHTML = `Controls: WASD to move, Space to jump, 1-9 to select hotbar slot, H to toggle HUD/Log, R to respawn<br>${pointingInfo}<br>${faceInfo}<br>Player Position: X:${player.position.x.toFixed(2)} Y:${player.position.y.toFixed(2)} Z:${player.position.z.toFixed(2)}<br>FPS: ${fps}<br>Time: ${currentTime}`;
    }

    // Update log display
    document.getElementById('log').style.display = logVisible ? 'block' : 'none';

    // Render hotbar cubes
    hotbarCubes.forEach((item, index) => {
        if (item) {
            item.cube.rotation.x += 0.01;
            item.cube.rotation.y += 0.01;
            item.miniRenderer.render(item.miniScene, item.miniCamera);
        }
    });

    // Move clouds
    clouds.children.forEach(cloud => {
        cloud.position.x += 0.01;
        if (cloud.position.x > 50) {
            cloud.position.x = -50;
        }
    });

    renderer.render(scene, camera);
}

animate();

// Initial block in hand update
updateBlockInHand();

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});