const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');

/* =====================================================
   CANVAS FIXO EM 1920×1080
   ===================================================== */
gameCanvas.width = 1920;
gameCanvas.height = 1080;

/* =====================================================
   DESENHAR MAPA SEM PERDER QUALIDADE (CONTAIN)
   ===================================================== */
function drawMapContained(img) {
    const cw = gameCanvas.width;
    const ch = gameCanvas.height;

    const iw = img.width;
    const ih = img.height;

    // Escala para caber dentro do canvas (contain)
    const scale = Math.min(cw / iw, ch / ih);

    const newW = iw * scale;
    const newH = ih * scale;

    // Centralização
    const offsetX = (cw - newW) / 2;
    const offsetY = (ch - newH) / 2;

    // Fundo preto nas bordas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cw, ch);

    // Desenhar o mapa
    ctx.drawImage(img, offsetX, offsetY, newW, newH);
}

/* =====================================================
   CALCULAR POSIÇÃO REAL DO MOUSE NO CANVAS
   ===================================================== */
function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", (event) => {
    const pos = getMousePos(gameCanvas, event);
    mouseX = pos.x - 20;
    mouseY = pos.y - 20;
});

/* =====================================================
   ATUALIZAÇÃO DOS TOKENS SPLITADOS (HOLDING)
   ===================================================== */
setInterval(() => {
    document.querySelectorAll('.holding').forEach((t) => {
        t.style.left = `${mouseX}px`;
        t.style.top = `${mouseY}px`;
    });
}, 10);

/* =====================================================
   CARREGAR MAPA
   ===================================================== */
function loadMap() {
    const img = new Image();
    img.src = '/static/maps/image.png';

    img.onload = () => drawMapContained(img);
}

function generateRandomHexColor() {
    // Generate a random number between 0 and 16777215 (FFFFFF in hex)
    const randomColor = Math.floor(Math.random() * 16777215);
    // Convert the number to a hexadecimal string and pad with leading zeros if necessary
    let hexColor = randomColor.toString(16);
    while (hexColor.length < 6) {
        hexColor = "0" + hexColor;
    }
    // Prepend '#' to make it a valid hex color code
    return "#" + hexColor;
}


/* =====================================================
   CARREGAR TOKENS (DIV)
   ===================================================== */
function loadTokens() {
    const tokens = [
        {
            name: 'Brian',
            x: 110,
            y: 110,
            img: 'static/tokens/image.png'
        }, {
            name: 'Alissa',
            x: 0,
            y: 0,
        }
    ];

    const panel = document.getElementById('token-panel');

    tokens.forEach((tdata) => {
        const token = document.createElement('div');

        token.className = 'token';
        token.style.position = 'absolute';
        token.style.width = '48px';
        token.style.height = '48px';
        token.style.borderRadius = '50%';
        token.style.backgroundColor = `${generateRandomHexColor()}`
        token.style.left = `${tdata.x}px`;
        token.style.top = `${tdata.y}px`;
        token.style.pointerEvents = 'auto';

        token.addEventListener('mouseover', (e) => {
            if (token.classList.contains('holding')) return;

            const pos = getMousePos(gameCanvas, e);

            const name = document.getElementById('panel-token-name');
            const hp = document.getElementById('panel-token-hp');

            name.innerText = 'NAME: ' + tdata.name;
            hp.innerText = 'HP: ' + `${Math.floor(Math.random() * 30)}/30`

            panel.style.left = `${pos.x + 50}px`;
            panel.style.top = `${pos.y}px`;
            panel.style.visibility = 'visible';
        });

        token.addEventListener('mouseout', () => {
            if (!token.classList.contains('holding'))
                panel.style.visibility = 'hidden';
        });

        token.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;

            if (token.classList.contains('holding')) {
                return token.classList.remove('holding');
            }

            panel.style.visibility = 'hidden';
            token.classList.add('holding');
        });

        document.getElementById('mapContainer').appendChild(token);
    });
}

/* =====================================================
   START
   ===================================================== */
loadMap();
loadTokens();
