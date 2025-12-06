// Santa Dash Game - Dodge the Reindeer Poop!

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameRunning = false;
let score = 0;
let presentsCollected = 0;
let highScore = localStorage.getItem('santaDashHighScore') || 0;
let gameSpeed = 3;
let frameCount = 0;
let selectedCharacter = 'santa'; // Default character
let snowballsRemaining = 20; // Limited snowballs
let snowballs = []; // Array to store active snowballs

// Santa Properties
const santa = {
    x: 100,
    y: 280,
    width: 50,
    height: 80,
    normalY: 280,
    duckingY: 320,
    isDucking: false,
    duckingHeight: 40
};

// Arrays for game objects
let poops = [];
let presents = [];
let reindeer = {
    x: 800,
    y: 150,
    width: 60,
    height: 50,
    speed: 3
};

// Input handling
let keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        duck();
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault(); // Prevent page scroll
        throwSnowball();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        stopDuck();
    }
});

// Mobile controls
document.getElementById('duckBtn').addEventListener('mousedown', duck);
document.getElementById('duckBtn').addEventListener('mouseup', stopDuck);
document.getElementById('duckBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    duck();
});
document.getElementById('duckBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDuck();
});

// Snowball button controls
document.getElementById('throwBtn').addEventListener('click', throwSnowball);
document.getElementById('throwBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    throwSnowball();
});

// Start/Restart buttons
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('gameOver').classList.add('hidden');
    startGame();
});

function duck() {
    if (gameRunning) {
        santa.isDucking = true;
        santa.y = santa.duckingY;
    }
}

function stopDuck() {
    santa.isDucking = false;
    santa.y = santa.normalY;
}

function throwSnowball() {
    if (gameRunning && snowballsRemaining > 0) {
        // Find the nearest poop to target
        let targetPoop = null;
        let minDistance = Infinity;
        
        for (let poop of poops) {
            const distance = Math.sqrt(
                Math.pow(poop.x - santa.x, 2) + 
                Math.pow(poop.y - santa.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                targetPoop = poop;
            }
        }
        
        snowballs.push({
            x: santa.x + santa.width,
            y: santa.y + santa.height / 2,
            width: 15,
            height: 15,
            speed: 8,
            target: targetPoop // Store the target poop
        });
        snowballsRemaining--;
        document.getElementById('snowballs').textContent = snowballsRemaining;
    }
}

function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    gameRunning = true;
    score = 0;
    presentsCollected = 0;
    gameSpeed = 3;
    frameCount = 0;
    poops = [];
    presents = [];
    snowballs = [];
    snowballsRemaining = 20; // Reset snowballs
    santa.isDucking = false;
    santa.y = santa.normalY;
    
    // Reset reindeer position
    reindeer.x = 800;
    
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('snowballs').textContent = snowballsRemaining;
    gameLoop();
}

function spawnPoop() {
    // Only spawn poop if reindeer is in the game area (not off screen)
    if (reindeer.x >= 0 && reindeer.x <= canvas.width) {
        poops.push({
            x: reindeer.x + reindeer.width / 2 - 15,  // Center the poop under reindeer
            y: reindeer.y + reindeer.height,
            width: 30,
            height: 30,
            fallSpeed: 3,  // Speed of falling down
            horizontalSpeed: 2  // Move left as it falls
        });
    }
}

function spawnPresent() {
    // Presents spawn at Santa's upper body height (standing height only)
    presents.push({
        x: canvas.width,
        y: 290,  // Mid-body height - can only collect while standing
        width: 25,
        height: 25,
        speed: gameSpeed
    });
}

function updateReindeer() {
    // Move reindeer right to left across the screen
    reindeer.x -= reindeer.speed;
    
    // Reset reindeer to right side when it goes off screen
    if (reindeer.x < -reindeer.width) {
        reindeer.x = canvas.width + 20;
    }
}

function updatePoops() {
    // Move poops - they fall down AND move left!
    for (let i = poops.length - 1; i >= 0; i--) {
        poops[i].y += poops[i].fallSpeed;  // Fall downward
        poops[i].x -= poops[i].horizontalSpeed;  // Move left as they fall
        
        // Remove poops that hit the ground or go off screen
        if (poops[i].y > 360 || poops[i].x < -50) {
            poops.splice(i, 1);
            score += 10; // Points for dodging
        }
    }
}

function updateSnowballs() {
    // Move snowballs with homing capability
    for (let i = snowballs.length - 1; i >= 0; i--) {
        const snowball = snowballs[i];
        
        // If snowball has a target and target still exists, home in on it
        if (snowball.target && poops.includes(snowball.target)) {
            const target = snowball.target;
            
            // Calculate direction to target
            const dx = target.x + target.width / 2 - (snowball.x + snowball.width / 2);
            const dy = target.y + target.height / 2 - (snowball.y + snowball.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Normalize and apply speed
            if (distance > 0) {
                snowball.x += (dx / distance) * snowball.speed;
                snowball.y += (dy / distance) * snowball.speed;
            }
        } else {
            // No target or target destroyed, move straight right
            snowball.x += snowball.speed;
        }
        
        // Check collision with poops
        for (let j = poops.length - 1; j >= 0; j--) {
            if (checkCollision(snowball, poops[j])) {
                // Destroy both snowball and poop
                poops.splice(j, 1);
                snowballs.splice(i, 1);
                score += 25; // Bonus points for destroying poop
                break; // Exit inner loop since snowball is destroyed
            }
        }
        
        // Remove snowballs that go off screen or too far
        if (snowballs[i] && (snowball.x > canvas.width + 50 || snowball.x < -50 || 
            snowball.y > canvas.height + 50 || snowball.y < -50)) {
            snowballs.splice(i, 1);
        }
    }
}

function updatePresents() {
    for (let i = presents.length - 1; i >= 0; i--) {
        presents[i].x -= presents[i].speed;
        
        // Remove off-screen presents
        if (presents[i].x + presents[i].width < 0) {
            presents.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Check poop collisions - only hit if Santa is standing (not ducking)
    if (!santa.isDucking) {
        for (let poop of poops) {
            if (checkCollision(santa, poop)) {
                gameOver();
                return;
            }
        }
    }
    
    // Check present collisions - only collect if standing (not ducking)
    if (!santa.isDucking) {
        for (let i = presents.length - 1; i >= 0; i--) {
            if (checkCollision(santa, presents[i])) {
                presents.splice(i, 1);
                presentsCollected++;
                score += 50;
                document.getElementById('presents').textContent = presentsCollected;
            }
        }
    }
}

function checkCollision(obj1, obj2) {
    // Simple rectangular collision detection
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function drawSanta() {
    const currentHeight = santa.isDucking ? santa.duckingHeight : santa.height;
    drawCharacter(ctx, selectedCharacter, santa.x, santa.y, santa.width, currentHeight, santa.isDucking);
}

function drawReindeer() {
    // Reindeer body
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(reindeer.x, reindeer.y, reindeer.width, reindeer.height);
    
    // Reindeer face
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(reindeer.x + 40, reindeer.y + 10, 20, 25);
    
    // Antlers
    ctx.fillStyle = '#654321';
    ctx.fillRect(reindeer.x + 45, reindeer.y - 10, 3, 12);
    ctx.fillRect(reindeer.x + 55, reindeer.y - 10, 3, 12);
    ctx.fillRect(reindeer.x + 42, reindeer.y - 8, 8, 3);
    ctx.fillRect(reindeer.x + 53, reindeer.y - 8, 8, 3);
    
    // Red nose
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(reindeer.x + 58, reindeer.y + 22, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawPoop() {
    for (let poop of poops) {
        // Draw poop emoji swirl (without face)
        const centerX = poop.x + 15;
        const centerY = poop.y + 15;
        
        // Bottom layer (darkest)
        ctx.fillStyle = '#5C4033';
        ctx.beginPath();
        ctx.arc(centerX, centerY + 8, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Middle layer
        ctx.fillStyle = '#6B4423';
        ctx.beginPath();
        ctx.arc(centerX, centerY + 2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Top swirl layer
        ctx.fillStyle = '#7D5A3C';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 4, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Top tip of swirl
        ctx.fillStyle = '#8B6F47';
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY - 9, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Very top point
        ctx.fillStyle = '#9B7F57';
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY - 13, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add wavy stink lines
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Left stink line
        ctx.beginPath();
        ctx.moveTo(centerX - 8, centerY - 15);
        ctx.quadraticCurveTo(centerX - 12, centerY - 20, centerX - 10, centerY - 25);
        ctx.stroke();
        
        // Middle stink line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 17);
        ctx.quadraticCurveTo(centerX - 2, centerY - 23, centerX, centerY - 28);
        ctx.stroke();
        
        // Right stink line
        ctx.beginPath();
        ctx.moveTo(centerX + 8, centerY - 15);
        ctx.quadraticCurveTo(centerX + 12, centerY - 20, centerX + 10, centerY - 25);
        ctx.stroke();
    }
}

function drawPresents() {
    for (let present of presents) {
        // Present box
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(present.x, present.y, present.width, present.height);
        
        // Ribbon
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(present.x + present.width / 2 - 2, present.y, 4, present.height);
        ctx.fillRect(present.x, present.y + present.height / 2 - 2, present.width, 4);
        
        // Bow
        ctx.beginPath();
        ctx.arc(present.x + present.width / 2, present.y + 5, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSnowballs() {
    for (let snowball of snowballs) {
        // Draw snowball
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(snowball.x + snowball.width / 2, snowball.y + snowball.height / 2, snowball.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some shine
        ctx.fillStyle = '#E6F2FF';
        ctx.beginPath();
        ctx.arc(snowball.x + snowball.width / 2 - 3, snowball.y + snowball.height / 2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGround() {
    // Snowy ground
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 360, canvas.width, 40);
    
    // Snow details
    ctx.fillStyle = '#E6F2FF';
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.arc(i + (frameCount % 30), 360, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSky() {
    // Sky with clouds
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Simple clouds
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(100 - (frameCount % 800), 50, 30, 0, Math.PI * 2);
    ctx.arc(130 - (frameCount % 800), 50, 40, 0, Math.PI * 2);
    ctx.arc(160 - (frameCount % 800), 50, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(500 - (frameCount % 600), 80, 25, 0, Math.PI * 2);
    ctx.arc(525 - (frameCount % 600), 80, 35, 0, Math.PI * 2);
    ctx.arc(550 - (frameCount % 600), 80, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

function gameLoop() {
    if (!gameRunning) return;
    
    frameCount++;
    
    // Increase difficulty over time
    if (frameCount % 600 === 0) {
        gameSpeed += 0.5;
    }
    
    // Spawn poop more frequently
    if (frameCount % 45 === 0) {
        spawnPoop();
    }
    
    // Spawn presents less frequently
    if (frameCount % 180 === 0) {
        spawnPresent();
    }
    
    // Update
    updateReindeer();
    updatePoops();
    updatePresents();
    updateSnowballs(); // Update snowballs
    checkCollisions();
    
    // Increase score over time
    if (frameCount % 10 === 0) {
        score++;
    }
    
    // Draw
    drawSky();
    drawGround();
    drawReindeer();
    drawSanta();
    drawPoop();
    drawPresents();
    drawSnowballs(); // Draw snowballs
    
    // Update score display
    document.getElementById('score').textContent = score;
    
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('santaDashHighScore', highScore);
    }
    
    // Show game over screen
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalPresents').textContent = presentsCollected;
    document.getElementById('gameOver').classList.remove('hidden');
}

// Character Selection
function drawCharacter(ctx, character, x, y, width, height, isDucking) {
    const currentHeight = isDucking ? height / 2 : height;
    const yPos = isDucking ? y + 40 : y;
    
    switch(character) {
        case 'santa':
            drawSantaCharacter(ctx, x, yPos, width, currentHeight, isDucking);
            break;
        case 'elf':
            drawElfCharacter(ctx, x, yPos, width, currentHeight, isDucking);
            break;
        case 'snowman':
            drawSnowmanCharacter(ctx, x, yPos, width, currentHeight, isDucking);
            break;
        case 'gingerbread':
            drawGingerbreadCharacter(ctx, x, yPos, width, currentHeight, isDucking);
            break;
    }
}

function drawSantaCharacter(ctx, x, y, width, height, isDucking) {
    // Santa body (red suit)
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(x, y, width, height);
    
    // Santa's face
    ctx.fillStyle = '#FFDAB9';
    ctx.fillRect(x + 10, y + (isDucking ? 5 : 10), 30, 20);
    
    // Santa's beard
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 10, y + (isDucking ? 20 : 25), 30, 15);
    
    // Santa's hat
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(x + 10, y, 30, 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 10, y + 8, 30, 4);
    
    // Belt
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y + (isDucking ? 20 : 35), width, 5);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 15, y + (isDucking ? 18 : 33), 10, 9);
}

function drawElfCharacter(ctx, x, y, width, height, isDucking) {
    // Elf body (green suit)
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x, y, width, height);
    
    // Elf face
    ctx.fillStyle = '#FFDAB9';
    ctx.fillRect(x + 10, y + (isDucking ? 5 : 10), 30, 20);
    
    // Elf hat (pointy)
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(x + 25, y - 10);
    ctx.lineTo(x + 10, y + 10);
    ctx.lineTo(x + 40, y + 10);
    ctx.closePath();
    ctx.fill();
    
    // Hat bell
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x + 25, y - 10, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Belt
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, y + (isDucking ? 20 : 35), width, 5);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 15, y + (isDucking ? 18 : 33), 10, 9);
    
    // Ears
    ctx.fillStyle = '#FFDAB9';
    ctx.beginPath();
    ctx.arc(x + 8, y + (isDucking ? 10 : 15), 4, 0, Math.PI * 2);
    ctx.arc(x + 42, y + (isDucking ? 10 : 15), 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawSnowmanCharacter(ctx, x, y, width, height, isDucking) {
    // Snowman body (white)
    ctx.fillStyle = '#FFFFFF';
    
    if (!isDucking) {
        // Bottom snowball
        ctx.beginPath();
        ctx.arc(x + width/2, y + height - 15, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Middle snowball
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Head snowball
        ctx.beginPath();
        ctx.arc(x + width/2, y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Ducking - just two snowballs
        ctx.beginPath();
        ctx.arc(x + width/2, y + height - 12, 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + width/2, y + 12, 12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Hat
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + width/2 - 10, y - 5, 20, 8);
    ctx.fillRect(x + width/2 - 6, y - 12, 12, 7);
    
    // Carrot nose
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(x + width/2, y + (isDucking ? 10 : 15));
    ctx.lineTo(x + width/2 + 8, y + (isDucking ? 12 : 17));
    ctx.lineTo(x + width/2, y + (isDucking ? 14 : 19));
    ctx.closePath();
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + width/2 - 5, y + (isDucking ? 8 : 12), 2, 0, Math.PI * 2);
    ctx.arc(x + width/2 + 5, y + (isDucking ? 8 : 12), 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Buttons
    ctx.fillStyle = '#000000';
    if (!isDucking) {
        ctx.beginPath();
        ctx.arc(x + width/2, y + height/2 - 5, 2, 0, Math.PI * 2);
        ctx.arc(x + width/2, y + height/2 + 5, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGingerbreadCharacter(ctx, x, y, width, height, isDucking) {
    // Gingerbread body
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 5, y, width - 10, height);
    
    // Round the corners for gingerbread shape
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(x + 25, y + 10, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Face
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + 20, y + (isDucking ? 8 : 12), 3, 0, Math.PI * 2);
    ctx.arc(x + 30, y + (isDucking ? 8 : 12), 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Smile
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 25, y + (isDucking ? 15 : 18), 5, 0, Math.PI);
    ctx.stroke();
    
    // Buttons
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + 25, y + (isDucking ? 25 : 35), 3, 0, Math.PI * 2);
    if (!isDucking) {
        ctx.arc(x + 25, y + 45, 3, 0, Math.PI * 2);
        ctx.arc(x + 25, y + 55, 3, 0, Math.PI * 2);
    }
    ctx.fill();
    
    // Icing outline
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5, y, width - 10, height);
}

// Draw character previews on start screen
function drawCharacterPreviews() {
    const characters = ['santa', 'elf', 'snowman', 'gingerbread'];
    characters.forEach(char => {
        const canvas = document.getElementById(`preview-${char}`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawCharacter(ctx, char, 5, 5, 50, 80, false);
        }
    });
}

// Character selection handling
document.querySelectorAll('.character-option').forEach(option => {
    option.addEventListener('click', function() {
        // Remove selected class from all options
        document.querySelectorAll('.character-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        this.classList.add('selected');
        
        // Update selected character
        selectedCharacter = this.getAttribute('data-character');
    });
});

// Initialize character previews and select default character
window.addEventListener('load', () => {
    drawCharacterPreviews();
    document.querySelector('[data-character="santa"]').classList.add('selected');
});

// Initialize high score display
document.getElementById('highScore').textContent = highScore;

