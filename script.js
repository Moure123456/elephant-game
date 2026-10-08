<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>لعبة الفيل القافز</title>
    <style>
        * {
            box-sizing: border-box;
            user-select: none;
            -webkit-user-select: none;
        }

        body {
            margin: 0;
            padding: 0;
            background-color: #2c3e50;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: white;
            overflow: hidden;
        }

        h1 {
            margin: 5px 0;
            font-size: 20px;
        }

        #gameCanvas {
            border: 3px solid #fff;
            border-radius: 8px;
            background-color: #87CEEB;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            max-width: 95vw;
            max-height: 60vh;
            touch-action: manipulation;
        }

        .controls {
            margin-top: 15px;
            display: flex;
            gap: 15px;
        }

        .btn {
            background-color: #e67e22;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            cursor: pointer;
            touch-action: manipulation;
        }

        .btn:active {
            transform: scale(0.95);
            background-color: #d35400;
        }
    </style>
</head>
<body>

    <h1>🐘 لعبة الفيل القافز</h1>
    <canvas id="gameCanvas" width="800" height="400"></canvas>

    <div class="controls">
        <button class="btn" id="jumpBtn">⬆️ قفز</button>
        <button class="btn" id="restartBtn" style="background-color: #27ae60;">🔄 إعادة</button>
    </div>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const jumpBtn = document.getElementById('jumpBtn');
        const restartBtn = document.getElementById('restartBtn');

        // نظام الصوت (Web Audio API)
        let audioCtx = null;

        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        function playJumpSound() {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        }

        function playGameOverSound() {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        }

        // حالة اللعبة
        let score = 0;
        let gameOver = false;
        let frameCount = 0;

        const elephant = {
            x: 80,
            y: 280,
            width: 50,
            height: 50,
            velocityY: 0,
            gravity: 0.6,
            jumpPower: -12,
            isGrounded: true,
            draw() {
                ctx.fillStyle = '#7f8c8d';
                ctx.beginPath();
                ctx.roundRect(this.x, this.y, this.width, this.height, 10);
                ctx.fill();

                ctx.fillStyle = '#95a5a6';
                ctx.beginPath();
                ctx.ellipse(this.x + 10, this.y + 20, 10, 15, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(this.x + 38, this.y + 15, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#7f8c8d';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(this.x + 45, this.y + 30);
                ctx.quadraticCurveTo(this.x + 60, this.y + 35, this.x + 55, this.y + 45);
                ctx.stroke();
            },
            jump() {
                if (this.isGrounded && !gameOver) {
                    this.velocityY = this.jumpPower;
                    this.isGrounded = false;
                    playJumpSound();
                }
            },
            update() {
                this.velocityY += this.gravity;
                this.y += this.velocityY;

                if (this.y >= 280) {
                    this.y = 280;
                    this.velocityY = 0;
                    this.isGrounded = true;
                }
            }
        };

        const obstacles = [];
        const obstacleWidth = 30;

        function spawnObstacle() {
            const height = Math.floor(Math.random() * 40) + 40; 
            obstacles.push({
                x: canvas.width,
                y: 330 - height,
                width: obstacleWidth,
                height: height
            });
        }

        function drawEnvironment() {
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(0, 330, canvas.width, 70);

            ctx.fillStyle = '#219150';
            ctx.fillRect(0, 345, canvas.width, 55);
        }

        function checkCollision(rect1, rect2) {
            return (
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y
            );
        }

        function resetGame() {
            score = 0;
            obstacles.length = 0;
            elephant.y = 280;
            elephant.velocityY = 0;
            gameOver = false;
            loop();
        }

        function handleJump(e) {
            if (e) e.preventDefault();
            initAudio();
            if (gameOver) {
                resetGame();
            } else {
                elephant.jump();
            }
        }

        function loop() {
            if (gameOver) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('انتهت اللعبة!', canvas.width / 2, canvas.height / 2 - 20);
                ctx.font = '20px Arial';
                ctx.fillText(`النقاط: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
                ctx.fillText('اضغط إعادة للعب مجددًا', canvas.width / 2, canvas.height / 2 + 60);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            drawEnvironment();
            elephant.update();
            elephant.draw();

            frameCount++;
            if (frameCount % 110 === 0) {
                spawnObstacle();
            }

            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                obs.x -= 6;

                ctx.fillStyle = '#e67e22';
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.strokeStyle = '#d35400';
                ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

                if (checkCollision(elephant, obs)) {
                    gameOver = true;
                    playGameOverSound();
                }

                if (obs.x + obs.width < 0) {
                    obstacles.splice(i, 1);
                    score += 10;
                }
            }

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`النقاط: ${score}`, 20, 35);

            requestAnimationFrame(loop);
        }

        // دعم أحداث اللمس والماوس ولوحة المفاتيح
        canvas.addEventListener('touchstart', handleJump);
        canvas.addEventListener('mousedown', handleJump);
        jumpBtn.addEventListener('touchstart', handleJump);
        jumpBtn.addEventListener('click', handleJump);

        restartBtn.addEventListener('click', () => { initAudio(); resetGame(); });
        restartBtn.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); resetGame(); });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') handleJump(e);
            if (e.code === 'KeyR' && gameOver) resetGame();
        });

        loop();
    </script>
</body>
</html>
