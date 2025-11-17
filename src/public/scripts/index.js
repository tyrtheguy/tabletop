// ============================
// ID PERSISTENTE POR ABA
// ============================
function getPersistentID() {
    let id = sessionStorage.getItem("playerID");
    if (!id) {
        id = "player-" + Math.floor(Math.random() * 9999999);
        sessionStorage.setItem("playerID", id);
    }
    return id;
}

const playerID = getPersistentID();

let availableTokens = [
    {
        name: 'PeroPero',
        avatarLink: 'static/tokens/token.png',
        width: 120, height: 230
    },
    {
        name: 'Zumbi',
        avatarLink: 'static/tokens/zombie.png',
        width: 150, height: 230
    }
];

const socket = io({
    auth: { userId: playerID }
});

// ============================
// CANVAS E MAPA
// ============================
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');

gameCanvas.width = 1920;
gameCanvas.height = 1080;

function drawMapContained(img) {
    const cw = gameCanvas.width;
    const ch = gameCanvas.height;

    const iw = img.width;
    const ih = img.height;

    const scale = Math.min(cw / iw, ch / ih);
    const newW = iw * scale;
    const newH = ih * scale;

    const offsetX = (cw - newW) / 2;
    const offsetY = (ch - newH) / 2;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, offsetX, offsetY, newW, newH);
}

function loadMap(map) {
    const img = new Image();
    const loc = map ? map.loc : 'static/maps/room.png';

    img.src = loc;
    img.onload = () => drawMapContained(img);
}

// ============================
// CARREGA TOKENS DISPONÍVEIS
// ============================
function loadAvailableTokens() {
    const tokensDiv = document.getElementById('token-getter');

    availableTokens.forEach((token) => {
        const tokenLinkerDiv = document.createElement('div');
        const tokenLinker = document.createElement('label');
        const tokenProportionsController = document.getElementById('characters-scales');

        tokenLinker.classList.add('token-linker');
        tokenLinker.innerText = token.name;

        tokenProportionsController.onchange = () => {
            document.querySelectorAll('.token').forEach((t) => {
                t.style.transform = `scale(${tokenProportionsController.value / 100})`;
            });
        };

        tokenLinker.addEventListener('click', () => {
            const id = `token-${Math.floor(Math.random() * 1000000)}`;

            socket.emit('addToken', {
                id,
                token,
                x: 300,
                y: 300
            });
        });

        tokenLinkerDiv.appendChild(tokenLinker);
        tokensDiv.appendChild(tokenLinkerDiv);
    });
}

// ============================
// MOUSE
// ============================
let mouseX = 0, mouseY = 0;

function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const sX = canvas.width / rect.width;
    const sY = canvas.height / rect.height;

    return {
        x: ((event.clientX - rect.left) * sX) - 30,
        y: ((event.clientY - rect.top) * sY) - 100
    };
}

document.addEventListener("mousemove", event => {
    const pos = getMousePos(gameCanvas, event);
    mouseX = pos.x - 20;
    mouseY = pos.y - 20;
});

// ============================
// TOKENS (PLAYERS E TOKENS LIVRES)
// ============================
let currentHeldToken = null;
const tokens = {};

function setupToken(id, x, y, availableToken) {

    if (!availableToken) {
        availableToken = availableTokens[0];
    }

    // Se já existir, atualiza
    if (tokens[id]) {
        tokens[id].style.left = x + "px";
        tokens[id].style.top = y + "px";
        return;
    }

    const token = document.createElement("div");
    token.className = "token";
    token.name = id;

    token.style.position = "absolute";
    token.style.width = `${availableToken.width}px`;
    token.style.height = `${availableToken.height}px`;
    token.style.backgroundImage = `url('${availableToken.avatarLink}')`;
    token.style.backgroundRepeat = "no-repeat";
    token.style.backgroundPosition = "center center";
    token.style.backgroundSize = "cover";

    token.style.left = x + "px";
    token.style.top = y + "px";

    token.addEventListener("mousedown", () => {
        if (currentHeldToken === token) {
            token.classList.remove("holding");
            currentHeldToken = null;
            return;
        }
        if (currentHeldToken) {
            currentHeldToken.classList.remove("holding");
        }
        currentHeldToken = token;
        token.classList.add("holding");
    });

    document.getElementById("mapContainer").appendChild(token);
    tokens[id] = token;
}

// ============================
// LOOP DO MOVIMENTO
// ============================
function loop() {
    if (currentHeldToken) {
        currentHeldToken.style.left = mouseX + "px";
        currentHeldToken.style.top = mouseY + "px";

        socket.emit("playerMove", {
            id: currentHeldToken.name,
            x: mouseX,
            y: mouseY
        });
    }

    requestAnimationFrame(loop);
}
loop();

// ============================
// SOCKET EVENTS
// ============================
socket.on("currentPlayers", data => {
    for (const id in data) {
        const p = data[id];

        if (!p) continue;
        setupToken(id, p.x, p.y, availableTokens[0]);
    }
});

socket.on('mapList', mapArray => {
    const mapGetterDiv = document.getElementById('map-getter');

    mapArray.forEach((map) => {
        const mapGetterElem = document.createElement('label');
        mapGetterElem.innerText = `${map.name}`;
        mapGetterElem.classList.add('map-getter');

        mapGetterElem.addEventListener('click', () => {
            loadMap(map);
        });

        mapGetterDiv.appendChild(mapGetterElem);
    });
});

// 🔥 RECEBE TOKENS EXISTENTES AO ENTRAR
socket.on("sessionStatus", (status) => {
    status.activeTokens.forEach(data => {
        setupToken(data.id, data.x ?? 300, data.y ?? 300, data.token);
    });
});

// 🔥 TOKEN NOVO OU ALTERADO
socket.on('sessionUpdateActiveTokens', data => {
    setupToken(data.id, data.x ?? 300, data.y ?? 300, data.token);
});

// 🔥 PLAYER NOVO
socket.on("newPlayer", p => {
    if (!p) return;
    setupToken(p.id, p.x, p.y, availableTokens[0]);
});

// 🔥 QUALQUER TOKEN OU PLAYER ATUALIZADO
socket.on("updatePlayer", move => {
    if (!tokens[move.id]) return;

    tokens[move.id].style.left = move.x + "px";
    tokens[move.id].style.top = move.y + "px";
});

// 🔥 PLAYER DESCONECTOU
socket.on("playerDisconnect", id => {
    if (tokens[id]) {
        tokens[id].remove();
        delete tokens[id];
    }
});

// ============================
loadAvailableTokens();
loadMap();
