const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let gameOver = false;
let gameFrame = 0;

// الفيل
const elephant = {
    x: 60,
    y: 270,
    width: 60,
    height: 50,
    dy: 0,
    gravity: 0.6,
    jumpPower: -12,
    isGrounded: false,
    legAngle: 0
};

// الأشجار
const trees = [
    { x: 100, width: 40, height: 90 },
    { x: 300, width: 50, height: 120 },
    { x: 550, width: 45, height: 100 },
    { x: 750, width: 50, height: 110 }
];

// العوائق
const obstacles = [];
let obstacleTimer = 0;

function createObstacle() {
    obstacles.push({
        x: canvas.width,
        y: 305,
        width: 30,
        height: 35,
        speed: 5
    });
}

function handleAction() {
    if (elephant.isGrounded && !gameOver) {
        elephant.dy = elephant.jumpPower;
        elephant.isGrounded = false;
    } else if (gameOver) {
        resetGame();
    }
}

// التحكم
window.addEventListener("touchstart", handleAction);
window.addEventListener("keydown", function(e) {
    if (e.code === "Space") {
        handleAction();
    }
});

function resetGame() {
    score = 0;
    gameOver = false;
    obstacles.length = 0;
    elephant.y = 270;
    elephant.dy = 0;
    gameFrame = 0;
    obstacleTimer = 0;
    requestAnimationFrame(update);
}

function update() {
    if (gameOver) return;

    gameFrame++;

    // الحركة والفيزياء
    elephant.dy += elephant.gravity;
    elephant.y += elephant.dy;

    if (elephant.y + elephant.height >= 330) {
        elephant.y = 330 - elephant.height;
        elephant.dy = 0;
        elephant.isGrounded = true;
    }

    // حركة الأرجل
    if (elephant.isGrounded) {
        elephant.legAngle = Math.sin(gameFrame * 0.2) * 10;
    } else {
        elephant.legAngle = 5;
    }

    // تحريك الأشجار
    trees.forEach(function(tree) {
        tree.x -= 2;
        if (tree.x + tree.width < 0) {
            tree.x = canvas.width + Math.random() * 50;
        }
    });

    // توليد العوائق
    obstacleTimer++;
    if (obstacleTimer > 100) {
        createObstacle();
        obstacleTimer = 0;
    }

    // تحريك العوائق وفحص التصادم
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= obs.speed;

        if (
            elephant.x < obs.x + obs.width - 5 &&
            elephant.x + elephant.width - 5 > obs.x &&
            elephant.y < obs.y + obs.height &&
            elephant.y + elephant.height > obs.y
        ) {
            gameOver = true;
        }

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

// رسم الفيل
function drawElephant(x, y) {
    ctx.save();
    ctx.translate(x, y);

    // الأرجل الخلفية
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(10 - elephant.legAngle / 2, 32, 10, 18);
    ctx.fillRect(38 + elephant.legAngle / 2, 32, 10, 18);

    // جسم الفيل
    ctx.fillStyle = "#95a5a6";
    ctx.beginPath();
    ctx.arc(28, 22, 22, 0, Math.PI * 2);
    ctx.fill();

    // الأرجل الأمامية
    ctx.fillStyle = "#95a5a6";
    ctx.fillRect(10 + elephant.legAngle, 32, 10, 18);
    ctx.fillRect(38 - elephant.legAngle, 32, 10, 18);

    // الرأس
    ctx.beginPath();
    ctx.arc(48, 16, 14, 0, Math.PI * 2);
    ctx.fill();

    // الأذن
    ctx.fillStyle = "#7f8c8d";
    ctx.beginPath();
    ctx.arc(40, 16, 9, 0, Math.PI * 2);
    ctx.fill();

    // العين
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(52, 12, 2, 0, Math.PI * 2);
    ctx.fill();

    // الخرطوم
    ctx.strokeStyle = "#95a5a6";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(58, 18);
    const trunkMove = elephant.isGrounded ? Math.sin(gameFrame * 0.1) * 4 : -8;
    ctx.lineTo(68, 25 + trunkMove);
    ctx.stroke();

    ctx.restore();
}

// رسم الشجرة
function drawTree(tree) {
    ctx.fillStyle = "#795548";
    ctx.fillRect(tree.x + tree.width / 2 - 6, 330 - tree.height, 12, tree.height);

    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.arc(tree.x + tree.width / 2, 330 - tree.height, tree.width / 1.1, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    // السماء
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // الأشجار
    trees.forEach(drawTree);

    // الأرض
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(0, 330, canvas.width, 70);
    ctx.fillStyle = "#388e3c";
    ctx.fillRect(0, 330, canvas.width, 6);

    // الفيل
    drawElephant(elephant.x, elephant.y);

    // العوائق
    ctx.fillStyle = "#6d4c41";
    obstacles.forEach(function(obs) {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // النتيجة
    ctx.fillStyle = "#000000";
    ctx.font = "bold 20px Arial";
    ctx.fillText("النتيجة: " + score, 20, 30);
}

function showGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "18px Arial";
    ctx.fillText("إلمس الشاشة لإعادة اللعب", canvas.width / 2, canvas.height / 2 + 30);
}

// بدء التشغيل
update();
