<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لعبة الفيل القافز مع الأصوات</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #2c3e50;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: white;
        }

        h1 {
            margin-bottom: 10px;
        }

        #gameCanvas {
            border: 4px solid #fff;
            border-radius: 8px;
            background-color: #87CEEB; /* لون السماء */
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }

        .instructions {
            margin-top: 15px;
            font-size: 18px;
        }
    </style>
</head>
<body>

    <h1>🐘 لعبة الفيل القافز</h1>
    <canvas id="gameCanvas" width="800" height="400"></canvas>
    <div class="instructions"><b>Space</b> للقفز | <b>R</b> للإعادة | <b>Esc</b> لإغلاق اللعبة</div>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // ==================== نظام الصوت (Web Audio API) ====================
        let audioCtx = null;

        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        // 1. صوت القفز
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

        // 2. صوت جمع العملات
        function playCoinSound() {
            if (!audioCtx) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(987.77, now); // نغمة B5
            osc.frequency.setValueAtTime(1318.51, now + 0.08); // نغمة E6

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.start(now);
            osc.stop(now + 0.25);
        }

        // 3. صوت بدء اللعبة
        function playStartSound() {
            if (!audioCtx) return;
            const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            notes.forEach((freq, index) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                const startTime = audioCtx.currentTime + index * 0.08;
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

                osc.start(startTime);
                osc.stop(startTime + 0.1);
            });
        }

        // 4. صوت الخسارة
        function playGameOverSound() {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.6);

            gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
        }

        // 5. صوت الفوز
        function playWinSound() {
            if (!audioCtx) return;
            const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
            notes.forEach((freq, index) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                const startTime = audioCtx.currentTime + index * 0.12;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.25, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

                osc.start(startTime);
                osc.stop(startTime + 0.2);
            });
        }

        // 6. صوت إغلاق اللعبة
        function playCloseSound() {
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }

        // ==================== حالة اللعبة ====================
        let score = 0;
        let gameOver = false;
        let gameWon = false;
        let gameClosed = false;
        let frameCount = 0;

        // إعدادات الفيل
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
                if (this.isGrounded) {
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

        // مصفوفات العناصر
        const obstacles = [];
        const coins = [];
        const obstacleWidth = 30;

        function spawnObstacle() {
            const height = Math.floor(Math.random() * 40) + 40; 
            obstacles.push({
                x: canvas.width,
                y: 330 - height,
                width: obstacleWidth,
                height: height
            });

            // احتمال 50% لتوليد عملة ذهبية فوق الحاجز
            if (Math.random() > 0.5) {
                coins.push({
                    x: canvas.width + 5,
                    y: 330 - height - 40,
                    radius: 12,
                    collected: false
                });
            }
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

        function checkCoinCollision(circle, rect) {
            const closeX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
            const closeY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
            const distX = circle.x - closeX;
            const distY = circle.y - closeY;
            return (distX * distX + distY * distY) < (circle.radius * circle.radius);
        }

        function resetGame() {
            score = 0;
            obstacles.length = 0;
            coins.length = 0;
            elephant.y = 280;
            elephant.velocityY = 0;
            gameOver = false;
            gameWon = false;
            gameClosed = false;
            playStartSound();
            loop();
        }

        // الحلقة البرمجية الرئيسية
        function loop() {
            if (gameClosed) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('تم إغلاق اللعبة', canvas.width / 2, canvas.height / 2);
                ctx.font = '18px Arial';
                ctx.fillText('اضغط على R للبدء من جديد', canvas.width / 2, canvas.height / 2 + 40);
                return;
            }

            if (gameOver) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#e74c3c';
                ctx.font = 'bold 36px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('انتهت اللعبة!', canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.fillText(`النتيجة النهاية: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
                ctx.fillText('اضغط على R لإعادة اللعب', canvas.width / 2, canvas.height / 2 + 60);
                return;
            }

            if (gameWon) {
                ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🎉 مبروك! لقد فزت! 🎉', canvas.width / 2, canvas.height / 2 - 20);
                ctx.font = '22px Arial';
                ctx.fillText(`جمعت ${score} نقطة!`, canvas.width / 2, canvas.height / 2 + 25);
                ctx.fillText('اضغط على R للعب مرة أخرى', canvas.width / 2, canvas.height / 2 + 65);
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

            // رسم وتحريك الحواجز
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
                    score += 5;
                }
            }

            // رسم وتحريك العملات
            for (let i = coins.length - 1; i >= 0; i--) {
                const coin = coins[i];
                coin.x -= 6;

                // رسم العملة الذهبية
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#f39c12';
                ctx.lineWidth = 2;
                ctx.stroke();

                // كشف جمع العملة
                if (!coin.collected && checkCoinCollision(coin, elephant)) {
                    coin.collected = true;
                    coins.splice(i, 1);
                    score += 15;
                    playCoinSound();

                    // الشرط المخصص للفوز (مثلاً عند الوصول إلى 100 نقطة)
                    if (score >= 100 && !gameWon) {
                        gameWon = true;
                        playWinSound();
                    }
                } else if (coin.x + coin.radius < 0) {
                    coins.splice(i, 1);
                }
            }

            // عرض النتيجة
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`النقاط: ${score}`, 20, 35);

            requestAnimationFrame(loop);
        }

        // الاستماع للأزرار
        document.addEventListener('keydown', (e) => {
            initAudio(); // تفعيل الصوت عند أول ضغطة زر

            if (e.code === 'Space') {
                e.preventDefault();
                if (!gameOver && !gameWon && !gameClosed) {
                    elephant.jump();
                }
            }

            if (e.code === 'KeyR') {
                if (gameOver || gameWon || gameClosed) {
                    resetGame();
                }
            }

            if (e.code === 'Escape' && !gameClosed) {
                gameClosed = true;
                playCloseSound();
            }
        });

        // تشغيل صوت البدء عند تحريك الماوس أو النقر لتجاوز قيود حظر الصوت التلقائي
        window.addEventListener('click', () => {
            if (!audioCtx) {
                initAudio();
                playStartSound();
            }
        }, { once: true });

        loop();
    </script>
</body>
</html>
