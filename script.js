const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let gameOver = false;
let gameFrame = 0;

// الفيل
const elephant = {
    x: 80,
    y: 280,
    width: 65,
    height: 50,
    dy: 0,
    gravity: 0.6,
    jumpPower: -13,
    isGrounded: false,
    legAngle: 0
};

// الأشجار في الخلفية
const trees = [
    { x: 100, width: 40, height: 100 },
    { x: 300, width: 60, height: 130 },
    { x: 550, width: 45, height: 110 },
    { x: 750, width: 50, height: 120 }
];

// العوائق (صخور / شجيرات)
const obstacles = [];
let obstacleTimer = 0;

function createObstacle() {
    obstacles.push({
        x: canvas.width,
        y: 310,
        width: 35,
        height: 35,
        speed: 6
    });
}

// التحكم
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && elephant.isGrounded && !gameOver) {
        elephant.dy = elephant.jumpPower;
        elephant.isGrounded = false;
    } else if (e.code === "Space" && gameOver) {
        resetGame();
    }
});

document.addEventListener("touchstart", () => {
    if (elephant.isGrounded && !gameOver) {
        elephant.dy = elephant.jumpPower;
        elephant.isGrounded = false;
    } else if (gameOver) {
        resetGame();
    }
});

function resetGame() {
    score = 0;
    gameOver = false;
    obstacles.length = 0;
    elephant.y = 280;
    elephant.dy = 0;
    gameFrame = 0;
    requestAnimationFrame(update);
}

function update() {
    if (gameOver) return;

    gameFrame++;

    // حركة الفيل للقفز
    elephant.dy += elephant.gravity;
    elephant.y += elephant.dy;

    if (elephant.y + elephant.height >= 330) {
        elephant.y = 330 - elephant.height;
        elephant.dy = 0;
        elephant.isGrounded = true;
    }

    // انيميشن الأرجل أثناء الجري
    if (elephant.isGrounded) {
        elephant.legAngle = Math.sin(gameFrame * 0.2) * 12;
    } else {
        elephant.legAngle = 5;
    }

    // تحريك الأشجار للخلفية
    trees.forEach(tree => {
        tree.x -= 2;
        if (tree.x + tree.width < 0) {
            tree.x = canvas.width + Math.random() * 100;
        }
    });

    // توليد العوائق
    obstacleTimer++;
    if (obstacleTimer > 90) {
        createObstacle();
        obstacleTimer = 0;
    }

    // تحريك العوائق وفحص التصادم
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= obs.speed;

        // تصادم
        if (
            elephant.x < obs.x + obs.width - 5 &&
            elephant.x + elephant.width - 5 > obs.x &&
            elephant.y < obs.y + obs.height &&
            elephant.y + elephant.height > obs.y
        ) {
            gameOver = true;
        }

        // زيادة النقاط
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }

    draw();

    if (!gameOver) {
        requestAnimationFrame(update);
    } else {
        showGameOver();
    }
}

// رسم الفيل تفصيلي بالـ Canvas
function drawElephant(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // الأرجل الخلفية
    ctx.fillStyle = "#808b96";
    ctx.fillRect(10 - elephant.legAngle/2, 35, 10, 18);
    ctx.fillRect(40 + elephant.legAngle/2, 35, 10, 18);

    // جسم الفيل
    ctx.fillStyle = "#a6acaf";
    ctx.beginPath();
    ctx.ellipse(30, 25, 30, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // الأرجل الأمامية
    ctx.fillStyle = "#a6acaf";
    ctx.fillRect(10 + elephant.legAngle, 35, 10, 18);
    ctx.fillRect(40 - elephant.legAngle, 35, 10, 18);

    // الرأس
    ctx.beginPath();
    ctx.arc(52, 18, 15, 0, Math.PI * 2);
    ctx.fill();

    // الأذن
    ctx.fillStyle = "#808b96";
    ctx.beginPath();
    ctx.ellipse(45, 18, 10, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // العين
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(56, 14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // الخرطوم (متحرك عند القفز)
    ctx.strokeStyle = "#a6acaf";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(63, 20);
    const trunkCurl = elephant.isGrounded ? Math.sin(gameFrame * 0.1) * 5 : -10;
    ctx.quadraticCurveTo(75, 25, 70 + trunkCurl, 38);
    ctx.stroke();

    // الناب
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 24);
    ctx.quadraticCurveTo(66, 26, 68, 20);
    ctx.stroke();

    ctx.restore();
}

// رسم شجرة
function drawTree(tree) {
    // الجذع
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(tree.x + tree.width / 2 - 8, canvas.height - 70 - tree.height, 16, tree.height);

    // أوراق الشجرة
    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.arc(tree.x + tree.width / 2, canvas.height - 70 - tree.height, tree.width / 1.2, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // السماء والغيوم
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // رسم الأشجار في الخلفية
    trees.forEach(drawTree);

    // الأرض
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(0, 
