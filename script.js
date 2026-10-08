// ==========================================
// 1. إعداد المؤثرات الصوتية (Audio Setup)
// ==========================================
const soundJump = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
const soundScore = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
const soundGameOver = new Audio('https://actions.google.com/sounds/v1/cartoon/clime_up_and_fall.ogg');

// ضبط مستويات الصوت (0.0 إلى 1.0)
soundJump.volume = 0.5;
soundScore.volume = 0.6;
soundGameOver.volume = 0.7;

// ==========================================
// 2. إعداد العناصر والسطح (Canvas Setup)
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ==========================================
// 3. حالة اللعبة واللاعب (Player & Game State)
// ==========================================
let score = 0;
let gameOver = false;

const player = {
    x: 100,
    y: canvas.height - 150,
    width: 60,
    height: 60,
    velocityY: 0,
    gravity: 0.8,
    jumpPower: -15,
    isGrounded: false,
    speed: 5
};

// ==========================================
// 4. التحكم والدعم اللمسي (Controls)
// ==========================================
const jumpBtn = document.getElementById('jump-btn');

function triggerJump() {
    if (player.isGrounded && !gameOver) {
        player.velocityY = player.jumpPower;
        player.isGrounded = false;
        
        // تشغيل صوت القفز
        soundJump.currentTime = 0;
        soundJump.play().catch(e => console.log("Audio play deferred"));
    } else if (gameOver) {
        restartGame();
    }
}

jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerJump(); });
jumpBtn.addEventListener('click', triggerJump);

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        triggerJump();
    }
});

// ==========================================
// 5. العوائق والمكافآت (Obstacles & Collectibles)
// ==========================================
let obstacles = [];
let coins = [];
let frameCount = 0;

function spawnObstacle() {
    obstacles.push({
        x: canvas.width,
        y: canvas.height - 100,
        width: 40,
        height: 50,
        speed: 6
    });
}

function spawnCoin() {
    coins.push({
        x: canvas.width,
        y: canvas.height - 180 - Math.random() * 100,
        radius: 15,
        speed: 6
    });
}

// ==========================================
// 6. الحلقة الرئيسية للعبة (Game Loop)
// ==========================================
function update() {
    if (gameOver) return;

    frameCount++;

    // تطبيق الفيزياء على الفيل
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    const groundLevel = canvas.height - 100 - player.height;
    if (player.y >= groundLevel) {
        player.y = groundLevel;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // توليد العوائق والعملات
    if (frameCount % 120 === 0) spawnObstacle();
    if (frameCount % 90 === 0) spawnCoin();

    // تحديث العوائق واختبار الاصطدام
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacles[i].speed;

        // فحص الاصطدام مع الفيل
        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            gameOver = true;
            // تشغيل صوت الخسارة
            soundGameOver.currentTime = 0;
            soundGameOver.play().catch(e => console.log("Audio play deferred"));
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    // تحديث العملات وتجميع النقاط
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].x -= coins[i].speed;

        // فحص تجميع النقاط
        let distX = (player.x + player.width / 2) - coins[i].x;
        let distY = (player.y + player.height / 2) - coins[i].y;
        let distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < player.width / 2 + coins[i].radius) {
            score += 10;
            coins.splice(i, 1);

            // تشغيل صوت جمع النقاط
            soundScore.currentTime = 0;
            soundScore.play().catch(e => console.log("Audio play deferred"));
            continue;
        }

        if (coins[i].x + coins[i].radius < 0) {
            coins.splice(i, 1);
        }
    }
}

function draw() {
    // رسم الخلفية والسماء
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // رسم الأرض
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // رسم الفيل (تمثيل مبسط)
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // عين الفيل
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + 40, player.y + 10, 10, 10);

    // رسم العوائق
    ctx.fillStyle = '#e74c3c';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // رسم المكافآت/العملات
    ctx.fillStyle = '#f1c40f';
    coins.forEach(coin => {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // عرض النتيجة
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.direction = 'rtl';
    ctx.fillText(`النقاط: ${score}`, canvas.width - 120, 50);

    // شاشة الخسارة
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('انتهت اللعبة!', canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('اضغط قفز لإعادة اللعب', canvas.width / 2, canvas.height / 2 + 30);
    }
}

function restartGame() {
    score = 0;
    obstacles = [];
    coins = [];
    frameCount = 0;
    gameOver = false;
    player.y = canvas.height - 150;
    player.velocityY = 0;
    loop();
}

function loop() {
    update();
    draw();
    if (!gameOver) {
        requestAnimationFrame(loop);
    }
}

loop();
