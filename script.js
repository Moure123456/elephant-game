// ==========================================
// 1. إعداد الأصوات (Audio Setup)
// ==========================================
const soundJump = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
const soundScore = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
const soundGameOver = new Audio('https://actions.google.com/sounds/v1/cartoon/clime_up_and_fall.ogg');

soundJump.volume = 0.5;
soundScore.volume = 0.6;
soundGameOver.volume = 0.7;

// ==========================================
// 2. إعداد شاشة اللعبة (Canvas Setup)
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
// 3. حالة اللعبة واللاعب (Elephant)
// ==========================================
let piScore = 0; // رصيد عملات Pi المجمعة
let gameOver = false;
let frameCount = 0;

const elephant = {
    x: 80,
    y: canvas.height - 170,
    width: 70,
    height: 60,
    velocityY: 0,
    gravity: 0.8,
    jumpPower: -15,
    isGrounded: false
};

// ==========================================
// 4. عناصر البيئة (شجر النخل، العوائق، وعملة Pi)
// ==========================================
let palmTrees = [];
let obstacles = [];
let piCoins = [];

// إنشاء شجر النخل في الخلفية
for (let i = 0; i < 5; i++) {
    palmTrees.push({
        x: i * 250 + Math.random() * 50,
        speed: 1.5
    });
}

function spawnObstacle() {
    obstacles.push({
        x: canvas.width,
        y: canvas.height - 110,
        width: 35,
        height: 50,
        speed: 5.5
    });
}

function spawnPiCoin() {
    piCoins.push({
        x: canvas.width,
        y: canvas.height - 180 - Math.random() * 80,
        radius: 18,
        speed: 5.5
    });
}

// ==========================================
// 5. التحكم بالقفز
// ==========================================
const jumpBtn = document.getElementById('jump-btn');

function triggerJump() {
    if (elephant.isGrounded && !gameOver) {
        elephant.velocityY = elephant.jumpPower;
        elephant.isGrounded = false;
        
        soundJump.currentTime = 0;
        soundJump.play().catch(e => console.log("Audio ready"));
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
// 6. دالـة الرسم المتكاملة (Drawing)
// ==========================================

// رسم شجرة النخل والبلح
function drawPalmTree(x) {
    const groundY = canvas.height - 60;
    // الجذع
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 15, groundY - 120, 15, 120);
    
    // أوراق النخلة
    ctx.fillStyle = '#2E8B57';
    ctx.beginPath();
    ctx.arc(x + 22, groundY - 120, 45, 0, Math.PI * 2);
    ctx.fill();

    // البلح الأحمر
    ctx.fillStyle = '#D22B2B';
    ctx.beginPath();
    ctx.arc(x + 12, groundY - 110, 6, 0, Math.PI * 2);
    ctx.arc(x + 32, groundY - 110, 6, 0, Math.PI * 2);
    ctx.fill();
}

// رسم الفيل بشكل مميز
function drawElephant(x, y, w, h) {
    // جسم الفيل
    ctx.fillStyle = '#708090';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 15);
    ctx.fill();

    // الأذن
    ctx.fillStyle = '#A9A9A9';
    ctx.beginPath();
    ctx.arc(x + 15, y + 25, 16, 0, Math.PI * 2);
    ctx.fill();

    // العين
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + w - 20, y + 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + w - 18, y + 18, 2, 0, Math.PI * 2);
    ctx.fill();

    // الخرطوم
    ctx.fillStyle = '#708090';
    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#708090';
    ctx.moveTo(x + w - 5, y + 30);
    ctx.quadraticCurveTo(x + w + 15, y + 35, x + w + 10, y + 50);
    ctx.stroke();

    // الأنياب
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(x + w - 2, y + 38, 4, 0, Math.PI * 2);
    ctx.fill();
}

// رسم عملة Pi
function drawPiCoin(coin) {
    // القرص الذهبي
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();

    // رمز Pi بالمنتصف (π)
    ctx.fillStyle = '#7B1FA2';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('π', coin.x, coin.y + 1);
}

// ==========================================
// 7. تحديث الحركة والفيزياء (Update)
// ==========================================
function update() {
    if (gameOver) return;

    frameCount++;

    // حركة خلفية شجر النخل
    palmTrees.forEach(tree => {
        tree.x -= tree.speed;
        if (tree.x < -100) tree.x = canvas.width + Math.random() * 50;
    });

    // فيزياء حركة الفيل
    elephant.velocityY += elephant.gravity;
    elephant.y += elephant.velocityY;

    const groundLevel = canvas.height - 60 - elephant.height;
    if (elephant.y >= groundLevel) {
        elephant.y = groundLevel;
        elephant.velocityY = 0;
        elephant.isGrounded = true;
    }

    // توليد العوائق والعملات
    if (frameCount % 130 === 0) spawnObstacle();
    if (frameCount % 85 === 0) spawnPiCoin();

    // تحديث العوائق واختبار الاصطدام
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacles[i].speed;

        if (
            elephant.x < obstacles[i].x + obstacles[i].width &&
            elephant.x + elephant.width > obstacles[i].x &&
            elephant.y < obstacles[i].y + obstacles[i].height &&
            elephant.y + elephant.height > obstacles[i].y
        ) {
            gameOver = true;
            soundGameOver.currentTime = 0;
            soundGameOver.play().catch(e => console.log("Audio play deferred"));
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    // تحديث عملات Pi وتجميعها للمحفظة
    for (let i = piCoins.length - 1; i >= 0; i--) {
        piCoins[i].x -= piCoins[i].speed;

        let distX = (elephant.x + elephant.width / 2) - piCoins[i].x;
        let distY = (elephant.y + elephant.height / 2) - piCoins[i].y;
        let distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < elephant.width / 2 + piCoins[i].radius) {
            piScore += 1; // زيادة عملة Pi
            piCoins.splice(i, 1);

            soundScore.currentTime = 0;
            soundScore.play().catch(e => console.log("Audio play deferred"));
            continue;
        }

        if (piCoins[i].x + piCoins[i].radius < 0) {
            piCoins.splice(i, 1);
        }
    }
}

// ==========================================
// 8. الدالة الرئيسية للرسم والشاشة (Draw Loop)
// ==========================================
function draw() {
    // رسم السماء الغروب
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#4ca1af');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // رسم خلفية شجر النخل والبلح
    palmTrees.forEach(tree => drawPalmTree(tree.x));

    // رسم الأرضية
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // رسم الفيل
    drawElephant(elephant.x, elephant.y, elephant.width, elephant.height);

    // رسم العوائق
    ctx.fillStyle = '#c0392b';
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // رسم عملات Pi
    piCoins.forEach(coin => drawPiCoin(coin));

    // عرض واجهة المحفظة والرصيد
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.roundRect(15, 15, 190, 45, 10);
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillText(`محفظة Pi: ${piScore} π`, 190, 45);

    // شاشة إعادة اللعب عند الخسارة
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 34px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('اصطدم الفيل!', canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.fillText(`جمعت ${piScore} عملة Pi في المحفظة`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('اضغط قفز لإعادة اللعب', canvas.width / 2, canvas.height / 2 + 60);
    }
}

function restartGame() {
    piScore = 0;
    obstacles = [];
    piCoins = [];
    frameCount = 0;
    gameOver = false;
    elephant.y = canvas.height - 170;
    elephant.velocityY = 0;
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
