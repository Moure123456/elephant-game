// تهيئة Pi SDK
if (window.Pi) {
    try {
        window.Pi.init({ version: "2.0", sandbox: true });
    } catch(e) {
        console.log("Pi SDK Initialization:", e);
    }
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ضبط أبعاد اللعبة للأفقية
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

// مستويات القفز الثلاثة
const JUMP_LEVELS = [
    { level: 1, power: -11 },
    { level: 2, power: -15 },
    { level: 3, power: -18 }
];
let currentJumpLevel = 0;

// الفيل
const elephant = {
    x: 100,
    y: 0,
    width: 70,
    height: 55,
    speedX: 0,
    maxSpeed: 8,
    dy: 0,
    gravity: 0.65,
    isGrounded: false,
    legAngle: 0
};

// الأشجار في الخلفية (3D Perspective)
const trees = [];
for (let i = 0; i < 8; i++) {
    trees.push({
        x: Math.random() * canvas.width * 2,
        z: Math.random() * 0.8 + 0.2, // عمق 3D
        height: 100 + Math.random() * 50
    });
}

// العوائق العشوائية
const obstacles = [];
let obstacleTimer = 0;

// طيور قادمة من نهاية الشاشة
const birds = [];
let birdTimer = 0;

// عملات Pi Network
const coins = [];
let coinTimer = 0;

// بكرة التحكم (Joystick)
const joystickContainer = document.getElementById("joystick-container");
const joystickKnob = document.getElementById("joystick-knob");
let isDraggingJoystick = false;
let joystickStartX = 0;

// تحكم البكرة
joystickContainer.addEventListener("touchstart", (e) => {
    isDraggingJoystick = true;
    joystickStartX = e.touches[0].clientX;
});

window.addEventListener("touchmove", (e) => {
    if (!isDraggingJoystick) return;
    const currentX = e.touches[0].clientX;
    let diffX = currentX - joystickStartX;
    diffX = Math.max(-35, Math.min(35, diffX)); // تقييد الحركة داخل البكرة

    joystickKnob.style.transform = `translateX(${diffX}px)`;
    elephant.speedX = (diffX / 35) * elephant.maxSpeed;
});

window.addEventListener("touchend", () => {
    isDraggingJoystick = false;
    joystickKnob.style.transform = `translateX(0px)`;
    elephant.speedX = 0; // الوقوف عند التكاسل عن السحب
});

// زر القفز ومستويات القفز
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
    } else if (currentJumpLevel < 2) { // قفزة ثانية أو ثالثة
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
    gameOver = false;
    obstacles.length = 0;
    birds.length = 0;
    coins.length = 0;
    elephant.x = 100;
    elephant.y = canvas.height - 120;
    elephant.dy = 0;
    elephant.speedX = 0;
    gameFrame = 0;
    requestAnimationFrame(update);
}

function update() {
    if (gameOver) return;

    gameFrame++;
    const groundY = canvas.height - 80;

    // حركة الفيل الأفقية والعمودية
    elephant.x += elephant.speedX;
    elephant.x = Math.max(20, Math.min(canvas.width - elephant.width, elephant.x)); // تقييد الحركة بالحواف

    elephant.dy += elephant.gravity;
    elephant.y += elephant.dy;

    if (elephant.y + elephant.height >= groundY) {
        elephant.y = groundY - elephant.height;
        elephant.dy = 0;
        elephant.isGrounded = true;
        currentJumpLevel = 0;
    }

    // حركة الأرجل
    if (elephant.isGrounded && Math.abs(elephant.speedX) > 0.5) {
        elephant.legAngle = Math.sin(gameFrame * 0.3) * 12;
    }

    // الأشجار 3D
    trees.forEach(tree => {
        tree.x -= (2 + elephant.speedX * 0.2) * tree.z;
        if (tree.x < -100) tree.x = canvas.width + Math.random() * 200;
    });

    // توليد عوائق عشوائية
    obstacleTimer++;
    if (obstacleTimer > 90 + Math.random() * 50) {
        obstacles.push({
            x: canvas.width,
            y: groundY - (30 + Math.random() * 30),
            width: 35 + Math.random() * 20,
            height: 35 + Math.random() * 25,
            speed: 4 + Math.random() * 3
        });
        obstacleTimer = 0;
    }

    // توليد طيور قادمة من نهاية اللعبة
    birdTimer++;
    if (birdTimer > 120 + Math.random() * 80) {
        birds.push({
            x: canvas.width,
            y: groundY - (100 + Math.random() * 120),
            width: 40,
            height: 30,
            speed: 6 + Math.random() * 4,
            wingAngle: 0
        });
        birdTimer = 0;
    }

    // توليد عملات Pi في أرتفاعات مختلفة للقفز
    coinTimer++;
    if (coinTimer > 60) {
        coins.push({
            x: canvas.width,
            y: groundY - (50 + Math.random() * 150),
            radius: 16,
            speed: 4
        });
        coinTimer = 0;
    }

    // تحديث العوائق والتصادم
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= obs.speed + elephant.speedX * 0.5;

        if (checkCollision(elephant, obs)) gameOver = true;
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }

    // تحديث الطيور والتصادم
    for (let i = birds.length - 1; i >= 0; i--) {
        let bird = birds[i];
        bird.x -= bird.speed + elephant.speedX * 0.5;
        bird.wingAngle = Math.sin(gameFrame * 0.3) * 10;

        if (checkCollision(elephant, bird)) gameOver = true;
        if (bird.x + bird.width < 0) birds.splice(i, 1);
    }

    // جمع عملات Pi
    for (let i = coins.length - 1; i >= 0; i--) {
        let coin = coins[i];
        coin.x -= coin.speed + elephant.speedX * 0.5;

        let dist = Math.hypot((elephant.x + elephant.width/2) - coin.x, (elephant.y + elephant.height/2) - coin.y);
        if (dist < coin.radius + 25) {
            piCoins++;
            score += 20;
            coins.splice(i, 1);
        } else if (coin.x < -20) {
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

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// رسم ثلاثي الأبعاد والرسوم الفنية
function draw() {
    const groundY = canvas.height - 80;

    // السماء (Gradient 3D)
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, "#1a2a6c");
    skyGrad.addColorStop(0.5, "#b21f1f");
    skyGrad.addColorStop(1, "#fdbb2d");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // الأشجار 3D بالعمق
    trees.forEach(tree => {
        ctx.fillStyle = `rgba(34, 139, 34, ${tree.z})`;
        ctx.beginPath();
        ctx.arc(tree.x, groundY - tree.height, 40 * tree.z, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(101, 67, 33, ${tree.z})`;
        ctx.fillRect(tree.x - 5 * tree.z, groundY - tree.height, 10 * tree.z, tree.height);
    });

    // الأرضية مع تجسيم 3D
    ctx.fillStyle = "#2d8a4e";
    ctx.fillRect(0, groundY, canvas.width, 80);
    ctx.fillStyle = "#1b5e20";
    ctx.fillRect(0, groundY, canvas.width, 10);

    // رسم الفيل
    drawElephant(elephant.x, elephant.y);

    // رسم العوائق
    ctx.fillStyle = "#5d4037";
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // رسم الطيور
    birds.forEach(bird => {
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, 12, 0, Math.PI * 2);
        ctx.fill();
        // الأجنحة
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bird.x, bird.y);
        ctx.lineTo(bird.x - 15, bird.y - 10 + bird.wingAngle);
        ctx.stroke();
    });

    // رسم عملة Pi Network المستديرة
    coins.forEach(coin => {
        ctx.fillStyle = "#f39c12";
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // رمز Pi
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("π", coin.x, coin.y + 5);
    });

    // الواجهة والنتيجة
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`النقاط: ${score}`, 20, 35);
    ctx.fillText(`عملات Pi: ${piCoins} π`, 20, 65);
    ctx.fillText(`مستوى القفز: ${currentJumpLevel + 1}/3`, 20, 95);
}

function drawElephant(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // الأرجل
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(10 - elephant.legAngle/2, 38, 12, 18);
    ctx.fillRect(45 + elephant.legAngle/2, 38, 12, 18);

    // جسم الفيل مجسم
    ctx.fillStyle = "#95a5a6";
    ctx.beginPath();
    ctx.arc(35, 25, 26, 0, Math.PI * 2);
    ctx.fill();

    // الرأس
    ctx.beginPath();
    ctx.arc(58, 18, 16, 0, Math.PI * 2);
    ctx.fill();

    // العين
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(62, 14, 3, 0, Math.PI * 2);
    ctx.fill();

    // الخرطوم
    ctx.strokeStyle = "#95a5a6";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(68, 20);
    ctx.lineTo(78, 30);
    ctx.stroke();

    ctx.restore();
}

function showGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText(`مجموع نقاطك: ${score} | عملات Pi المجمعة: ${piCoins} π`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("إلمس زر القفز للعب مجدداً", canvas.width / 2, canvas.height / 2 + 60);
}

resetGame();
