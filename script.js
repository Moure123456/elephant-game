// تهيئة Pi SDK
let piUserAddress = localStorage.getItem("pi_wallet_address") || "";

if (window.Pi) {
    try {
        window.Pi.init({ version: "2.0", sandbox: true });
        window.Pi.authenticate(['username', 'wallet_address'], function(payment) {})
          .then(function(auth) {
              if (auth.user.walletAddress) {
                  piUserAddress = auth.user.walletAddress;
                  localStorage.setItem("pi_wallet_address", piUserAddress);
              }
          }).catch(function(e) { console.log("Pi Auth Error:", e); });
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
// استرجاع عملات Pi المحفوظة دائمًا وعدم تصفيرها عند الخسارة
let totalPiCoins = parseInt(localStorage.getItem("total_pi_coins")) || 0;
let currentSessionCoins = 0; // العملات المجمعة في الجولة الحالية

let gameOver = false;
let gameWon = false;
let gameFrame = 0;
let passedObstaclesCount = 0;

// الألوان العشوائية للفيل
const ELEPHANT_COLORS = ["#95a5a6", "#3498db", "#e74c3c", "#9b59b6", "#1abc9c", "#f39c12", "#e67e22"];
let currentElephantColor = ELEPHANT_COLORS[0];

// مستويات القفز
const JUMP_LEVELS = [
    { level: 1, power: -14 },
    { level: 2, power: -16.5 },
    { level: 3, power: -19 }
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

// خلفيات اللعبة
const BACKGROUND_THEMES = ["default", "black", "gold", "green"];

// أشجار الخلفية
const bgTrees = [];
for (let i = 0; i < 6; i++) {
    bgTrees.push({
        x: Math.random() * canvas.width * 2,
        z: Math.random() * 0.6 + 0.3,
        height: 80 + Math.random() * 40
    });
}

const palmObstacles = [];
let obstacleTimer = 0;

const birds = [];
let birdTimer = 0;

const coins = [];
let coinTimer = 0;

// ألعاب نارية
const fireworks = [];

// بكرة التحكم
const joystickContainer = document.getElementById("joystick-container");
const joystickKnob = document.getElementById("joystick-knob");
let isDraggingJoystick = false;
let joystickStartX = 0;

if (joystickContainer && joystickKnob) {
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
}

// القفز
const jumpBtn = document.getElementById("jump-btn");
if (jumpBtn) {
    jumpBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        performJump();
    });
}

function performJump() {
    if (gameOver || gameWon) {
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
    currentSessionCoins = 0;
    passedObstaclesCount = 0;
    gameOver = false;
    gameWon = false;
    fireworks.length = 0;
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

function triggerWin() {
    gameWon = true;
    for (let i = 0; i < 120; i++) {
        fireworks.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.5) * 16,
            color: `hsl(${Math.random() * 360}, 100%, 60%)`,
            radius: Math.random() * 6 + 3,
            alpha: 1
        });
    }
}

// تحويل العملات إلى محفظة Pi Network
function transferToWallet() {
    if (totalPiCoins < 100) {
        alert("تعتمد عمليات التحويل على تجميع 100 عملة Pi أو مضاعفاتها!");
        return;
    }

    let transferAmount = Math.floor(totalPiCoins / 100) * 100;
    if (!piUserAddress) {
        piUserAddress = prompt("أدخل عنوان محفظة Pi الخاصة بك (Public Key):", "G...");
        if (piUserAddress) {
            localStorage.setItem("pi_wallet_address", piUserAddress);
        } else {
            return;
        }
    }

    alert(`جاري تحويل ${transferAmount} π إلى المحفظة:\n${piUserAddress}`);
    totalPiCoins -= transferAmount;
    localStorage.setItem("total_pi_coins", totalPiCoins);
    alert("تمت عملية التحويل بنجاح وسُجلت في محفظتك!");
}

function update() {
    if (gameOver) return;

    if (gameWon) {
        drawWinState();
        return;
    }

    gameFrame++;
    const groundY = canvas.height - 70;

    // السرعة: بطيئة أول 50 نخلة، ثم تعود للسرعة العادية
    let speedMultiplier = passedObstaclesCount < 50 ? 0.65 : 1.0;

    // تغير لون الفيل عشوائياً أثناء السير
    if (gameFrame % 40 === 0 && Math.abs(elephant.speedX) > 0.1) {
        currentElephantColor = ELEPHANT_COLORS[Math.floor(Math.random() * ELEPHANT_COLORS.length)];
    }

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
        tree.x -= (1.5 + elephant.speedX * 0.2) * tree.z * speedMultiplier;
        if (tree.x < -80) tree.x = canvas.width + Math.random() * 150;
    });

    // توليد حواجز النخيل
    obstacleTimer++;
    if (obstacleTimer > (100 + Math.random() * 60) / speedMultiplier) {
        palmObstacles.push({
            x: canvas.width,
            y: groundY - 55,
            width: 38,
            height: 55,
            speed: (3.5 + Math.random() * 1.2) * speedMultiplier
        });
        obstacleTimer = 0;
    }

    // ظهور الطيور بعد 5 نخلات
    if (passedObstaclesCount >= 5) {
        birdTimer++;
        if (birdTimer > (180 + Math.random() * 100) / speedMultiplier) {
            birds.push({
                x: canvas.width,
                baseY: groundY - (90 + Math.random() * 80),
                y: 0,
                width: 35,
                height: 25,
                speed: (2.0 + Math.random() * 1.0) * speedMultiplier,
                waveFreq: Math.random() * 0.05 + 0.02,
                waveAmp: Math.random() * 30 + 15,
                wingPos: 0
            });
            birdTimer = 0;
        }
    }

    // توليد عملات Pi
    coinTimer++;
    if (coinTimer > 40) {
        coins.push({
            x: canvas.width,
            y: groundY - (35 + Math.random() * 130),
            radius: 18,
            speed: 3.5 * speedMultiplier
        });
        coinTimer = 0;
    }

    // تحديث حواجز النخيل
    for (let i = palmObstacles.length - 1; i >= 0; i--) {
        let palm = palmObstacles[i];
        palm.x -= palm.speed + elephant.speedX * 0.4 * speedMultiplier;

        if (checkCollision(elephant, palm)) gameOver = true;

        if (palm.x + palm.width < 0) {
            palmObstacles.splice(i, 1);
            score += 10;
            passedObstaclesCount++;
        }
    }

    // تحديث الطيور
    for (let i = birds.length - 1; i >= 0; i--) {
        let bird = birds[i];
        bird.x -= bird.speed + elephant.speedX * 0.3 * speedMultiplier;
        bird.y = bird.baseY + Math.sin(gameFrame * bird.waveFreq) * bird.waveAmp;
        bird.wingPos = Math.sin(gameFrame * 0.25) * 8;

        if (checkCollision(elephant, bird)) gameOver = true;
        if (bird.x + bird.width < 0) birds.splice(i, 1);
    }

    // جمع عملات Pi وحفظها بشكل دائم
    for (let i = coins.length - 1; i >= 0; i--) {
        let coin = coins[i];
        coin.x -= coin.speed + elephant.speedX * 0.4 * speedMultiplier;

        let dist = Math.hypot((elephant.x + elephant.width/2) - coin.x, (elephant.y + elephant.height/2) - coin.y);
        if (dist < coin.radius + 45) {
            totalPiCoins++;
            currentSessionCoins++;
            score += 20;
            localStorage.setItem("total_pi_coins", totalPiCoins); // حفظ دائم
            coins.splice(i, 1);

            // عند الوصول لـ 100 عملة ومضاعفاتها
            if (totalPiCoins > 0 && totalPiCoins % 100 === 0) {
                triggerWin();
                return;
            }
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

    drawElephant(elephant.x, elephant.y);
    palmObstacles.forEach(drawPalmTree);
    birds.forEach(drawBird);
    coins.forEach(drawPiCoin);

    // واجهة النتيجة والعملات المحفوظة
    ctx.fillStyle = currentTheme === "gold" ? "#000" : "#fff";
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`النقاط: ${score}`, 15, 30);
    ctx.fillText(`إجمالي عملات Pi بالمحفظة: ${totalPiCoins} π`, 15, 58);
    ctx.fillText(`النخلات: ${passedObstaclesCount}/50 ${passedObstaclesCount < 50 ? '(سرعة بطيئة)' : ''}`, 15, 86);
}

function drawWinState() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    fireworks.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.008;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    ctx.fillStyle = "#f1c40f";
    ctx.font = "80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏆", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 28px Arial";
    ctx.fillText("مبروك! جمعت 100 عملة Pi!", canvas.width / 2, canvas.height / 2 + 30);
    ctx.font = "18px Arial";
    ctx.fillText(`إجمالي محفظتك الآن: ${totalPiCoins} π`, canvas.width / 2, canvas.height / 2 + 65);

    requestAnimationFrame(update);
}

// رسم الفيل باللون المتردد المتغير
function drawElephant(x, y) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "#5d6d7e";
    ctx.fillRect(10 - elephant.legAngle/2, 35, 10, 16);
    ctx.fillRect(40 + elephant.legAngle/2, 35, 10, 16);

    // لون جسم الفيل الديناميكي
    ctx.fillStyle = currentElephantColor;
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

    ctx.strokeStyle = currentElephantColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(60, 18);
    ctx.lineTo(68, 28);
    ctx.stroke();

    ctx.restore();
}

function drawPalmTree(palm) {
    ctx.save();
    ctx.translate(palm.x, palm.y);

    ctx.fillStyle = "#795548";
    ctx.fillRect(palm.width / 2 - 5, 15, 10, palm.height - 15);

    ctx.fillStyle = "#1b5e20";
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(palm.width / 2, 15, 18, 6, (i * Math.PI) / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawBird(bird) {
    ctx.save();
    ctx.translate(bird.x, bird.y);

    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.ellipse(15, 12, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f39c12";
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-8, 9);
    ctx.lineTo(-8, 15);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(6, 9, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(5, 9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.ellipse(16, 12, 8, 4, bird.wingPos * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

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
    ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = "18px Arial";
    ctx.fillText(`إجمالي عملات المحفظة المحفوظة: ${totalPiCoins} π`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText("إلمس الشاشة لمتابعة اللعب وتجميع المزيد", canvas.width / 2, canvas.height / 2 + 50);
}

resetGame();
