// Get the canvas element and its 2D drawing context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set the canvas dimensions to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
const PLAYER_SIZE = 32;
const ENEMY_SIZE = 32;
const BULLET_SIZE = 8;
const BASE_PLAYER_SPEED = 5;
const BASE_BULLET_SPEED = 8;
const BASE_ENEMY_SPEED = 1; // Enemies move slower towards the player
let playerCoins = 0;
let playerWeapon = 'pistol'; // Start with a basic pistol
let playerHp = 100;

let player = {
    x: canvas.width / 2 - PLAYER_SIZE / 2,
    y: canvas.height - PLAYER_SIZE * 2,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: BASE_PLAYER_SPEED,
    hp: playerHp,
    angle: 0 // Player's rotation angle (in radians)
};

let bullets = [];
let enemies = [];
let lastFireTime = 0;
let waveNumber = 1; // Start at wave 1
const FIRE_RATE = 250; // Milliseconds for pistol
const SHOTGUN_FIRE_RATE = 500; // Milliseconds for shotgun
const ENEMY_SPAWN_RATE = 5; // Number of enemies per wave

let gamePaused = false; // Add a gamePaused variable to handle pause/resume

// Update the HUD elements
function updateHUD() {
    document.getElementById('score').innerText = `Score: ${waveNumber * 100}`;
    document.getElementById('health').innerText = `HP: ${player.hp}`;
    document.getElementById('currency').innerText = `Currency: ${playerCoins}`;
}

// Helper function to clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to draw the player
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.angle);
    ctx.fillStyle = 'saddlebrown';
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}

// Function to draw bullets
function drawBullets() {
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, BULLET_SIZE, BULLET_SIZE);
    });
}

// Function to draw enemies
function drawEnemies() {
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// Function to update the player's position
function updatePlayer() {
    if (keys['a'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['d'] && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
    if (keys['w'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['s'] && player.y + player.height < canvas.height) {
        player.y += player.speed;
    }
}

// Function to update the bullets' positions
function updateBullets() {
    bullets = bullets.filter(bullet => bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height);
    bullets.forEach(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    });
}

// Function to update the enemies' positions
function updateEnemies() {
    enemies.forEach(enemy => {
        // Calculate direction vector from enemy to player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction and move the enemy towards the player
        enemy.x += (dx / distance) * BASE_ENEMY_SPEED;
        enemy.y += (dy / distance) * BASE_ENEMY_SPEED;
    });
}

// Function to detect collisions between bullets and enemies
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + BULLET_SIZE > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + BULLET_SIZE > enemy.y) {
                // Remove the enemy and bullet
                enemies.splice(enemyIndex, 1);
                bullets.splice(bulletIndex, 1);
                // Increase the player's score and coins
                playerCoins += 10;
                updateHUD();
            }
        });
    });

    // Check if all enemies are defeated
    if (enemies.length === 0) {
        nextWave(); // Start the next wave
    }
}

// Function to spawn enemies at the edges of the screen
function spawnEnemies() {
    for (let i = 0; i < ENEMY_SPAWN_RATE * waveNumber; i++) {
        // Randomly decide which edge to spawn the enemy on
        const edge = Math.floor(Math.random() * 4);

        let x, y;

        switch (edge) {
            case 0: // Top edge
                x = Math.random() * canvas.width;
                y = -ENEMY_SIZE;
                break;
            case 1: // Right edge
                x = canvas.width;
                y = Math.random() * canvas.height;
                break;
            case 2: // Bottom edge
                x = Math.random() * canvas.width;
                y = canvas.height;
                break;
            case 3: // Left edge
                x = -ENEMY_SIZE;
                y = Math.random() * canvas.height;
                break;
        }

        enemies.push({
            x: x,
            y: y,
            width: ENEMY_SIZE,
            height: ENEMY_SIZE
        });
    }
}

// Function to calculate the angle between the player and the mouse cursor
function calculateAngleToMouse(mouseX, mouseY) {
    const dx = mouseX - (player.x + player.width / 2);
    const dy = mouseY - (player.y + player.height / 2);
    return Math.atan2(dy, dx);
}

// Function to handle shooting
function shoot() {
    const now = Date.now();
    let fireRate = playerWeapon === 'shotgun' ? SHOTGUN_FIRE_RATE : FIRE_RATE;

    if (now - lastFireTime > fireRate) {
        if (playerWeapon === 'shotgun') {
            // Shotgun fires multiple bullets at once
            for (let i = -1; i <= 1; i++) {
                const angleOffset = (Math.PI / 6) * i; // Spread the bullets out
                const angle = player.angle + angleOffset;
                bullets.push({
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    vx: Math.cos(angle) * BASE_BULLET_SPEED,
                    vy: Math.sin(angle) * BASE_BULLET_SPEED
                });
            }
        } else {
            // Pistol fires a single bullet
            bullets.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                vx: Math.cos(player.angle) * BASE_BULLET_SPEED,
                vy: Math.sin(player.angle) * BASE_BULLET_SPEED
            });
        }
        lastFireTime = now;
    }
}

// Shop functions
function buyHealthUpgrade() {
    if (playerCoins >= 50) {
        playerCoins -= 50;
        player.hp = Math.min(player.hp + 25, playerHp);
        updateHUD();
    } else {
        alert("Not enough coins!");
    }
}

function buyBulletSpeedUpgrade() {
    if (playerCoins >= 100) {
        playerCoins -= 100;
        BASE_BULLET_SPEED += 1;
        updateHUD();
    } else {
        alert("Not enough coins!");
    }
}

function buyPlayerSpeedUpgrade() {
    if (playerCoins >= 200) {
        playerCoins -= 100;
        player.speed += .5;
        updateHUD();
    } else {
        alert("Not enough coins!");
    }
}

function buyShotgun() {
    if (playerCoins >= 300) {
        playerCoins -= 100;
        playerWeapon = 'shotgun';
        document.getElementById('shotgunStatus').innerText = 'Purchased';
        updateHUD();
    } else {
        alert("Not enough coins!");
    }
}

// Track pressed keys
let keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'Enter' && !gamePaused) {
        showShop(); // Press 'Enter' to open the shop
    }
    if (e.key === ' ') {
        shoot(); // Press 'Space' to shoot
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Track mouse movement and update player angle
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    player.angle = calculateAngleToMouse(mouseX, mouseY);
});

// Function to start the next wave
function nextWave() {
    waveNumber++;
    spawnEnemies();
    updateHUD();
}

// Function to display the shop UI
function showShop() {
    // Pause the game
    gamePaused = true;
    document.getElementById('shop').style.display = 'block';
}

// Function to close the shop UI
function closeShop() {
    // Resume the game
    gamePaused = false;
    document.getElementById('shop').style.display = 'none';
}

// Game loop
function gameLoop() {
    if (!gamePaused) {
        clearCanvas();
        updatePlayer();
        updateBullets();
        updateEnemies();
        checkCollisions();
        drawPlayer();
        drawBullets();
        drawEnemies();
    }
    requestAnimationFrame(gameLoop);
}

// Start the game
spawnEnemies();
updateHUD();
gameLoop();
