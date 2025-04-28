document.addEventListener('DOMContentLoaded', function () {
    console.log('全畫面波浪動畫已載入！');

    // 建立 canvas 元素並插入 body
    let canvas = document.getElementById('waveCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'waveCanvas';
        document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    const display = document.createElement('div');
    display.style.position = 'absolute';
    display.style.top = '10px';
    display.style.left = '50%';
    display.style.transform = 'translateX(-50%)';
    display.style.fontSize = '20px';
    display.style.color = 'black';
    display.textContent = '無訊號';
    document.body.appendChild(display);

    let latestValue = 512; // 初始數值，範圍 0~1023
    let waveSpeed = 0.05; // 波浪速度，預設值
    let time = 0;

    // 隨機生成波浪參數
    function generateRandomWaveParams() {
        return {
            amplitude: 60 + Math.random() * 240, // 隨機波幅 (60~300)
            frequency: 0.005 + Math.random() * 0.02, // 隨機頻率 (0.005~0.025)
            phase: Math.random() * Math.PI * 2 // 隨機相位 (0~2π)
        };
    }

    // 初始化波浪參數
    let waves = Array.from({ length: 5 }, generateRandomWaveParams); // 預設 5 條波浪

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function drawWave() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        waves.forEach((wave, i) => {
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x++) {
                let y;
                if (i % 2 === 0) {
                    // 偶數：波浪紋
                    y = canvas.height / 2 +
                        Math.sin(x * wave.frequency + time + wave.phase) * wave.amplitude;
                } else {
                    // 奇數：閃電紋（鋸齒波 + 抖動）
                    let t = (x * wave.frequency + time + wave.phase) % (2 * Math.PI);
                    let saw = (t / Math.PI - 1) * wave.amplitude; // 鋸齒波
                    let jitter = (Math.random() - 0.5) * 10; // 抖動
                    y = canvas.height / 2 + saw + jitter;
                }
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(0, 0, 0, ${1 - i / waves.length})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        time += waveSpeed;
        requestAnimationFrame(drawWave);
    }

    async function connectToArduino() {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                console.log('接收到的數據:', value); // 調試輸出
                const inputValue = parseInt(value.trim(), 10);
                if (!isNaN(inputValue)) {
                    latestValue = inputValue;

                    // 根據數值調整波浪速度
                    waveSpeed = 0.05 + (latestValue / 1023) * 0.5; // 波浪速度範圍 (0.05 ~ 0.55)

                    display.textContent = `數值: ${latestValue}，波浪速度: ${waveSpeed.toFixed(3)}`;
                } else {
                    display.textContent = '無訊號';
                }
            }
        } catch (error) {
            console.error('連接 Arduino 時發生錯誤:', error);
            display.textContent = '無訊號';
        }
    }

    const connectButton = document.createElement('button');
    connectButton.textContent = '連接 Arduino';
    connectButton.style.position = 'absolute';
    connectButton.style.top = '10px';
    connectButton.style.left = '10px';
    connectButton.style.padding = '10px 20px';
    connectButton.style.fontSize = '16px';
    connectButton.style.cursor = 'pointer';
    document.body.appendChild(connectButton);
    connectButton.addEventListener('click', connectToArduino);

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawWave();
});