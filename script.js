// تهيئة Pi SDK
if (window.Pi) {
    try {
        window.Pi.init({ version: "2.0", sandbox: true });
    } catch(e) {
        console.log("Pi SDK Init:", e);
    }
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let score = 0;
let piCoins = 0;
let gameOver = false;
let gameFrame = 0;
let passedObstaclesCount = 0; // حساب الحواجز المتجاوزة

// مستويات القفز الثلاثة
const JUMP_LEVELS = [
    { level: 1, power: -11 },
    { level: 2, power: -14.5 },
    { level: 3, power: -17.5 }
];
let currentJumpLevel = 0;

// الفيل
const elephant = {
    x: 80,
    y: 0,
    width: 65,
    height: 50,
    speedX: 0,
    maxSpeed: 7,
    dy: 0,
    gravity: 0.6,
    isGrounded: false,
    legAngle: 0
};

// خلفيات اللعبة المتغيرة كل 10 حواجز
const BACKGROUND_THEMES = ["default", "black", "gold", "green"];

// أشجار خلفية
const bgTrees = [];
for (let i = 0; i < 6; i++) {
    bgTrees.push({
        x: Math.random() * canvas.width * 2,
        z: Math.random() * 0.6 + 0.3,
        height: 80 + Math.random() * 40
    });
}

// حواجز شجر النخيل
const palmObstacles = [];
let obstacleTimer = 0;

// عصافير تسير ببطء
const birds = [];
let birdTimer = 0;

// عملات Pi Network
const coins = [];
let coinTimer = 0;

// بكرة التحكم
const joystickContainer = document.getElementById("joystick-container");
const joystickKnob = document.getElementById("joystick-knob");
let isDraggingJoystick = false;
let joystickStartX = 0;

joystickContainer.addEventListener("touchstart", (e) => {
    isDraggingJoystick = true;
    joystickStartX = e.touches[0].clientX;
});

window.addEventListener("touchmove", (e) => {
    if (!isDraggingJoystick) return;
    const currentX = e.touches[0].clientX;
    let diffX = currentX - joystickStartX;
    diffX = Math.max(-30, Math.min(30, diffX));

    joystickKnob.style.transform = `translateX(${diffX}px)`;
    elephant.speedX = (diffX / 30) * elephant.maxSpeed;
});

window.addEventListener("touchend", () => {
    isDraggingJoystick = false;
    joystickKnob.style.transform = `translateX(0px)`;
    elephant.speedX = 0;
});

// القفز
const jumpBtn = document.getElementById("jump-btn");
jumpBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    performJump();
});

function performJump() {
    if (gameOver) {
        resetGame();
        return;
    }

    if (elephant.isGrounded) {
        currentJumpLevel = 0;
        elephant.dy = JUMP_LEVELS[currentJumpLevel].power;
        elephant.isGrounded = false;
    } else if (currentJumpLevel < 2) {
        currentJumpLevel++;
        elephant.dy = JUMP_LEVELS[currentJumpLevel].power;
    }
}

// دعم لوحة المفاتيح
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") performJump();
    if (e.code === "ArrowRight") elephant.speedX = 5;
    if (e.code === "ArrowLeft") elephant.speedX = -5;
});
window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowRight" || e.code === "ArrowLeft") elephant.speedX = 0;
});

function resetGame() {
    score = 0;
    piCoins = 0;
    passedObstaclesCount = 0;
    gameOver = false;
    palmObstacles.length = 0;
    birds.length = 0;
    coins.length = 0;
    elephant.x = 80;
    elephant.y = canvas.height - 120;
    elephant.dy = 0;
    elephant.speedX = 0;
    gameFrame = 0;
    requestAnimationFrame(update);
}

function update() {
    if (gameOver) return;

    gameFrame++;
    const groundY = canvas.height - 70;

    // حركة الفيل
    elephant.x += elephant.speedX;
    elephant.x = Math.max(10, Math.min(canvas.width - elephant.width, elephant.x));

    elephant.dy += elephant.gravity;
    elephant.y += elephant.dy;

    if (elephant.y + elephant.height >= groundY) {
        elephant.y = groundY - elephant.height;
        elephant.dy = 0;
        elephant.isGrounded = true;
        currentJumpLevel = 0;
    }

    if (elephant.isGrounded && Math.abs(elephant.speedX) > 0.3) {
        elephant.legAngle = Math.sin(gameFrame * 0.3) * 10;
    }

    // أشجار الخلفية
    bgTrees.forEach(tree => {
        tree.x -= (1.5 + elephant.speedX * 0.2) * tree.z;
        if (tree.x < -80) tree.x = canvas.width + Math.random() * 150;
    });

    // توليد حواجز النخيل
    obstacleTimer++;
    if (obstacleTimer > 100 + Math.random() * 60) {
        palmObstacles.push({
            x: canvas.width,
            y: groundY - 60,
            width: 40,
            height: 60,
            speed: 3.5 + Math.random() * 1.5
        });
        obstacleTimer = 0;
    }

    // توليد العصافير (سير بطيء)
    birdTimer++;
    if (birdTimer > 140 + Math.random() * 80) {
        birds.push({
            x: canvas.width,
            y: groundY - (80 + Math.random() * 120),
            width: 35,
            height: 25,
            speed: 2.2 + Math.random() * 1.2, // بطيئة
            wingPos: 0
        });
        birdTimer = 0;
    }

    // توليد عملات Pi بكثرة لسهولة الجمع
    coinTimer++;
    if (coinTimer > 45) {
        coins.push({
            x: canvas.width,
            y: groundY - (35 + Math.random() * 130),
            radius: 18, // حجم أكبر
            speed: 3.5
        });
        coinTimer = 0;
    }

    // تحديث حواجز النخيل
    for (let i = palmObstacles.length - 1; i >= 0; i--) {
        let palm = palmObstacles[i];
        palm.x -= palm.speed + elephant.speedX * 0.4;

        if (checkCollision(elephant, palm)) gameOver = true;

        if (palm.x + palm.width < 0) {
            palmObstacles.splice(i, 1);
            score += 10;
            passedObstaclesCount++; // زيادة عدد الحواجز لتغيير اللون
        }
    }

    // تحديث العصافير
    for (let i = birds.length - 1; i >= 0; i--) {
        let bird = birds[i];
        bird.x -= bird.speed + elephant.speedX * 0.3;
        bird.wingPos = Math.sin(gameFrame * 0.25) * 8; // رفرفة الجناحين

        if (checkCollision(elephant, bird)) gameOver = true;
        if (bird.x + bird.width < 0) birds.splice(i, 1);
    }

    // جمع عملات Pi مع مجال التقاط واسع وسهل
    for (let i = coins.length - 1; i >= 0; i--) {
        let coin = coins[i];
        coin.x -= coin.speed + elephant.speedX * 0.4;

        let dist = Math.hypot((elephant.x + elephant.width/2) - coin.x, (elephant.y + elephant.height/2) - coin.y);
        if (dist < coin.radius + 45) { // زيادة نطاق التقاط العملة بسهولة
            piCoins++;
            score += 20;
            coins.splice(i, 1);
        } else if (coin.x < -30) {
            coins.splice(i, 1);
        }
    }

    draw();

    if (!gameOver) {
        requestAnimationFrame(update);
    } else {
        showGameOver();
    }
}

function checkCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.width - 8 &&
        r1.x + r1.width - 8 > r2.x &&
        r1.y < r2.y + r2.height - 5 &&
        r1.y + r1.height > r2.y
    );
}

function draw() {
    const groundY = canvas.height - 70;

    // تحديد لون الخلفية بناءً على كل 10 حواجز
    let themeIndex = Math.floor(passedObstaclesCount / 10) % BACKGROUND_THEMES.length;
    let currentTheme = BACKGROUND_THEMES[themeIndex];

    if (currentTheme === "black") {
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (currentTheme === "gold") {
        let goldGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        goldGrad.addColorStop(0, "#f39c12");
        goldGrad.addColorStop(1, "#f1c40f");
        ctx.fillStyle = goldGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (currentTheme === "green") {
        let greenGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        greenGrad.addColorStop(0, "#11998e");
        greenGrad.addColorStop(1, "#38ef7d");
        ctx.fillStyle = greenGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // السماء الافتراضية
        let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, "#2980b9");
        skyGrad.addColorStop(1, "#6dd5fa");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // أشجار الخلفية
    bgTrees.forEach(tree => {
        ctx.fillStyle = `rgba(46, 204, 113, ${tree.z * 0.7})`;
        ctx.beginPath();
        ctx.arc(tree.x, groundY - tree.height, 35 * tree.z, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(120, 80, 40, ${tree.z * 0.7})`;
        ctx.fillRect(tree.x - 4 * tree.z, groundY - tree.height, 8 * tree.z, tree.height);
    });

    // الأرضية
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(0, groundY, canvas.width, 70);
    ctx.fillStyle = "#219150";
    ctx.fillRect(0, groundY, canvas.width, 8);

    // الفيل
    drawElephant(elephant.x, elephant.y);

    // رسم شجر النخيل (الحواجز)
    palmObstacles.forEach(drawPalmTree);

    // رسم العصافير
    birds.forEach(drawBird);

    // رسم عملات Pi
    coins.forEach(drawPiCoin);

    // معلومات اللعبة
    ctx.fillStyle = currentTheme === "gold" ? "#000" : "#fff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`النقاط: ${score}`, 15, 30);
    ctx.fillText(`عملات Pi: ${piCoins} π`, 15, 58);
    ctx.fillText(`مستوى القفز: ${currentJumpLevel + 1}/3`, 15, 86);
}

// رسم الفيل
function drawElephant(x, y) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(10 - elephant.legAngle/2, 35, 10, 16);
    ctx.fillRect(40 + elephant.legAngle/2, 35, 10, 16);

    ctx.fillStyle = "#95a5a6";
    ctx.beginPath();
    ctx.arc(30, 22, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(50, 16, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(54, 12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#95a5a6";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(60, 18);
    ctx.lineTo(68, 28);
    ctx.stroke();

    ctx.restore();
}

// رسم حاجز النخيل
function drawPalmTree(palm) {
    ctx.save();
    ctx.translate(palm.x, palm.y);

    // جذع النخلة
    ctx.fillStyle = "#795548";
    ctx.fillRect(palm.width / 2 - 5, 15, 10, palm.height - 15);

    // أوراق النخلة
    ctx.fillStyle = "#1b5e20";
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(palm.width / 2, 15, 18, 6, (i * Math.PI) / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// رسم العصفور المرفرف
function drawBird(bird) {
    ctx.save();
    ctx.translate(bird.x, bird.y);

    // جسم العصفور
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.ellipse(15, 12, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // المنقار
    ctx.fillStyle = "#f39c12";
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-8, 9);
    ctx.lineTo(-8, 15);
    ctx.fill();

    // العين
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(6, 9, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(5, 9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // الأجنحة المرفرفة
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.ellipse(16, 12, 8, 4, bird.wingPos * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// رسم عملة Pi
function drawPiCoin(coin) {
    ctx.save();
    ctx.fillStyle = "#f39c12";
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText("π", coin.x, coin.y + 5);
    ctx.restore();
}

function showGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "18px Arial";
    ctx.fillText(`مجموع نقاطك: ${score} | عملات Pi: ${piCoins} π`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("إلمس زر القفز للعب مجدداً", canvas.width / 2, canvas.height / 2 + 60);
}

resetGame();
