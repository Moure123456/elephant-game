// ==========================================
// 1. إعداد شاشة اللعبة
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// دالة آمنة لتشغيل الأصوات داخل المتصفحات
function playSound(url) {
    try {
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play deferred:", e));
    } catch(e) {
        console.log("Audio error:", e);
    }
}

// ==========================================
// 2. حالة اللعبة واللاعب (Elephant)
// ==========================================
let piScore = 0;
let gameOver = false;
let frameCount = 0;

const elephant = {
    x: 60,
    y: canvas.height - 160,
    width: 65,
    height: 55,
    velocityY: 0,
    gravity: 0.8,
    jumpPower: -14,
    isGrounded: false
};

// ==========================================
// 3. البيئة والعوائق
// ==========================================
let palmTrees = [];
let obstacles = [];
let piCoins = [];

for (let i = 0; i < 4; i++) {
    palmTrees.push({
        x: i * 220 + Math.random() * 40,
        speed: 1.5
    });
}

function spawnObstacle() {
    obstacles.push({
        x: canvas.width,
        y: canvas.height - 110,
        width: 35,
        height: 50,
        speed: 5
    });
}

function spawnPiCoin() {
    piCoins.push({
        x: canvas.width,
        y: canvas.height - 170 - Math.random() * 70,
        radius: 16,
        speed: 5
    });
}

// ==========================================
// 4. عناصر التحكم
// ==========================================
const jumpBtn = document.getElementById('jump-btn');

function triggerJump() {
    if (elephant.isGrounded && !gameOver) {
        elephant.velocityY = elephant.jumpPower;
        elephant.isGrounded = false;
        playSound('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
    } else if (gameOver) {
        restartGame();
    }
}

if (jumpBtn) {
    jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerJump(); });
    jumpBtn.addEventListener('click', triggerJump);
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        triggerJump();
    }
});

// ==========================================
// 5. دوال الرسم (Canvas Rendering)
// ==========================================
function drawPalmTree(x) {
    const groundY = canvas.height - 60;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 15, groundY - 110, 14, 110);
    
    ctx.fillStyle = '#2E8B57';
    ctx.beginPath();
    ctx.arc(x + 22, groundY - 110, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#D22B2B';
    ctx.beginPath();
    ctx.arc(x + 12, groundY - 100, 5, 0, Math.PI * 2);
    ctx.arc(x + 32, groundY - 100, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawElephant(x, y, w, h) {
    // الجسم
    ctx.fillStyle = '#708090';
    ctx.fillRect(x, y, w, h);

    // الأذن
    ctx.fillStyle = '#A9A9A9';
    ctx.beginPath();
    ctx.arc(x + 12, y + 20, 14, 0, Math.PI * 2);
    ctx.fill();

    // العين
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + w - 18, y + 12, 6, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + w - 16, y + 14, 3, 3);

    // الخرطوم
    ctx.fillStyle = '#708090';
    ctx.fillRect(x + w, y + 22, 12, 20);
    ctx.fillRect(x + w + 6, y + 36, 10, 6);
}

function drawPiCoin(coin) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7B1FA2';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('π', coin.x, coin.y + 1);
}

// ==========================================
// 6. دالة التحديث والتشغيل
// ==========================================
function update() {
    if (gameOver) return;

    frameCount++;

    palmTrees.forEach(tree => {
        tree.x -= tree.speed;
        if (tree.x < -80) tree.x = canvas.width + Math.random() * 40;
    });

    elephant.velocityY += elephant.gravity;
    elephant.y += elephant.velocityY;

    const groundLevel = canvas.height - 60 - elephant.height;
    if (elephant.y >= groundLevel) {
        elephant.y = groundLevel;
        elephant.velocityY = 0;
        elephant.isGrounded = true;
    }

    if (frameCount % 120 === 0) spawnObstacle();
    if (frameCount % 80 === 0) spawnPiCoin();

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacles[i].speed;

        if (
            elephant.x < obstacles[i].x + obstacles[i].width &&
            elephant.x + elephant.width > obstacles[i].x &&
            elephant.y < obstacles[i].y + obstacles[i].height &&
            elephant.y + elephant.height > obstacles[i].y
        ) {
            gameOver = true;
            playSound('https://actions.google.com/sounds/v1/cartoon/clime_up_and_fall.ogg');
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    for (let i = piCoins.length - 1; i >= 0; i--) {
        piCoins[i].x -= piCoins[i].speed;

        let distX = (elephant.x + elephant.width / 2) - piCoins[i].x;
        let distY = (elephant.y + elephant.height / 2) - piCoins[i].y;
        let distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < elephant.width
