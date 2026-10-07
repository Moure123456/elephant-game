
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let gameOver = false;

const elephant = {
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    color: "gray",
    dy: 0,
    gravity: 0.6,
    jumpPower: -12,
    isGrounded: false
};

const obstacle = {
    x: canvas.width,
    y: 310,
    width: 30,
    height: 30,
    color: "brown",
    speed: 5
};

// للتحكم عبر لوحة المفاتيح
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && elephant.isGrounded && !gameOver) {
        elephant.dy = elephant.jumpPower;
        elephant.isGrounded = false;
    }
    if (e.code === "Space" && gameOver) {
        resetGame();
    }
});

// للتحكم باللمس على الشاشة (للهواتف)
document.addEventListener("touchstart", () => {
    if (elephant.isGrounded && !gameOver) {
        elephant.dy = elephant.jumpPower;
        elephant.isGrounded = false;
    }
    if (gameOver) {
        resetGame();
    }
});

function resetGame() {
    score = 0;
    gameOver = false;
    obstacle.x = canvas.width;
    elephant.y = 300;
    elephant.dy = 0;
    requestAnimationFrame(update);
}

function update() {
    if (gameOver) return;

    elephant.dy += elephant.gravity;
    elephant.y += elephant.dy;

    if (elephant.y + elephant.height >= 340) {
        elephant.y = 340 - elephant.height;
        elephant.dy = 0;
        elephant.isGrounded = true;
    }

    obstacle.x -= obstacle.speed;
    if (obstacle.x + obstacle.width < 0) {
        obstacle.x = canvas.width;
        score += 10;
    }

    if (
        elephant.x < obstacle.x + obstacle.width &&
        elephant.x + elephant.width > obstacle.x &&
        elephant.y < obstacle.y + obstacle.height &&
        elephant.y + elephant.height > obstacle.y
    ) {
        gameOver = true;
    }

    draw();

    if (!gameOver) {
        requestAnimationFrame(update);
    } else {
        showGameOver();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2e8b57";
    ctx.fillRect(0, 340, canvas.width, 60);

    ctx.fillStyle = elephant.color;
    ctx.fillRect(elephant.x, elephant.y, elephant.width, elephant.height);

    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText("النتيجة: " + score, 20, 30);
}

function showGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFF";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "20px Arial";
    ctx.fillText("المس الشاشة لإعادة اللعب", canvas.width / 2, canvas.height / 2 + 30);
}

update();
