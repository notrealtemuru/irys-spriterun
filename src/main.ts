const sprite = document.getElementById('sprite') as HTMLDivElement;
const gameContainer = document.getElementById('game-container') as HTMLDivElement;
const messageScreen = document.getElementById('message-screen') as HTMLDivElement;
const messageTitle = document.getElementById('message-title') as HTMLHeadingElement;
const actionBtn = document.getElementById('action-btn') as HTMLButtonElement;
const scoreElement = document.getElementById('score') as HTMLDivElement;
const highScoreElement = document.getElementById('high-score') as HTMLDivElement;

const settings = {
    baseGameSpeed: 5,            
    maxGameSpeed: 18,            
    speedIncrease: 0.5,          
    jumpForce: 12,
    gravity: 0.5,
    spriteHeight: 60,
    obstacleWidth: 20,
    gameWidth: 600,
    minSpawnInterval: 500,       
    maxSpawnInterval: 900,       
    minObstacleGap: 300,           
    maxObstacleGap: 500,           
    scoreIncreaseInterval: 100,
    speedUpInterval: 30,         
    baseScoreMultiplier: 1,
    speedScoreFactor: 0.3        
};

let isJumping = false;
let isGameOver = false;
let isGameRunning = false;
let jumpVelocity = 0;
let animationFrameId: number | null = null;
let lastObstacleTime = 0;
let lastScoreUpdateTime = 0;
let obstacles: HTMLDivElement[] = [];
let nextObstacleX = settings.gameWidth;
let score = 0;
let highScore = 0;
let currentGameSpeed = settings.baseGameSpeed;

function loadHighScore() {
    const saved = localStorage.getItem('spriteHighScore');
    highScore = saved ? parseInt(saved) : 0;
    updateHighScoreDisplay();
}

function saveHighScore() {
    localStorage.setItem('spriteHighScore', highScore.toString());
    updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
    highScoreElement.textContent = `HI: ${highScore.toString().padStart(5, '0')}`;
}

function updateScoreDisplay() {
    scoreElement.textContent = score.toString().padStart(5, '0');
    if (score > highScore) {
        highScore = score;
        saveHighScore();
    }
}

function startGame() {
    isGameRunning = true;
    isGameOver = false;
    score = 0;
    currentGameSpeed = settings.baseGameSpeed;
    lastScoreUpdateTime = performance.now();
    lastObstacleTime = performance.now();
    messageScreen.style.display = 'none';
    updateScoreDisplay();
    initGame();
}

function initGame() {
    isJumping = false;
    jumpVelocity = 0;
    nextObstacleX = settings.gameWidth;
    obstacles = [];
    
    document.querySelectorAll('.obstacle').forEach(c => c.remove());
    sprite.style.bottom = '0';
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

function calculateScore(): number {
    return settings.baseScoreMultiplier + (currentGameSpeed * settings.speedScoreFactor);
}

function updateScore() {
    const now = performance.now();
    if (now - lastScoreUpdateTime > settings.scoreIncreaseInterval) {
        score += Math.round(calculateScore());
        lastScoreUpdateTime = now;
        updateScoreDisplay();
        
        if (score % settings.speedUpInterval === 0 && currentGameSpeed < settings.maxGameSpeed) {
            currentGameSpeed = Math.min(currentGameSpeed + settings.speedIncrease, settings.maxGameSpeed);
        }
    }
}

function createObstacle(xPosition: number): HTMLDivElement {
    const obstacle = document.createElement('div');
    obstacle.className = 'obstacle';
    obstacle.style.left = `${xPosition}px`;
    gameContainer.appendChild(obstacle);
    return obstacle;
}

function jump() {
    if (!isJumping && !isGameOver && isGameRunning) {
        isJumping = true;
        jumpVelocity = settings.jumpForce;
    }
}

function updateSprite() {
    if (!isJumping) return;
    
    const currentBottom = parseInt(sprite.style.bottom || '0');
    let newBottom = currentBottom + jumpVelocity;
    
    if (newBottom <= 0) {
        newBottom = 0;
        isJumping = false;
    }
    
    jumpVelocity -= settings.gravity;
    sprite.style.bottom = `${newBottom}px`;
}

function updateObstacles() {
    const now = performance.now();
    
    if (isGameRunning && now - lastObstacleTime > getRandomSpawnDelay()) {
        const newObstacle = createObstacle(nextObstacleX);
        obstacles.push(newObstacle);
        lastObstacleTime = now;
        nextObstacleX += settings.obstacleWidth + getRandomObstacleGap();
    }
    
    obstacles.forEach(obstacle => {
        const currentLeft = parseInt(obstacle.style.left);
        obstacle.style.left = `${currentLeft - currentGameSpeed}px`;
    });
    
    obstacles = obstacles.filter(obstacle => {
        const left = parseInt(obstacle.style.left);
        if (left < -settings.obstacleWidth) {
            obstacle.remove();
            return false;
        }
        return true;
    });
}

function getRandomSpawnDelay(): number {
    return settings.minSpawnInterval + Math.random() * (settings.maxSpawnInterval - settings.minSpawnInterval);
}

function getRandomObstacleGap(): number {
    return settings.minObstacleGap + Math.random() * (settings.maxObstacleGap - settings.minObstacleGap);
}

function checkCollisions() {
    const spriteRect = sprite.getBoundingClientRect();
    
    for (const obstacle of obstacles) {
        const obstacleRect = obstacle.getBoundingClientRect();
        
        if (spriteRect.right > obstacleRect.left + 10 &&
            spriteRect.left < obstacleRect.right - 10 &&
            spriteRect.bottom > obstacleRect.top) {
            endGame();
            break;
        }
    }
}

function endGame() {
    isGameOver = true;
    isGameRunning = false;
    showMessage('GAME OVER', 'RESTART');
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function showMessage(title: string, buttonText: string) {
    messageTitle.textContent = title;
    actionBtn.textContent = buttonText;
    messageScreen.style.display = 'flex';
}

function gameLoop() {
    if (isGameOver) return;
    
    updateScore();
    updateSprite();
    updateObstacles();
    checkCollisions();
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === 'ArrowUp') && !isGameRunning) {
        startGame();
    }
    else if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isJumping && !isGameOver && isGameRunning) {
            jump();
        }
    }
});

actionBtn.addEventListener('click', startGame);

window.addEventListener('load', () => {
    loadHighScore();
    showMessage('SPRITE RUN', 'START');
});