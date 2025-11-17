const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 9000;
const DB_FILE = "./players.json";
const MAP_FILE = "./mapData.json";
const SESSION_FILE = './session.json';

let players = {};
let maps = [];

let sessionStatus = {
    currentMap: [],
    activeTokens: []
};

try {
    players = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
} catch { players = {}; }

try {
    maps = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
} catch { maps = []; }

try {
    sessionStatus = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
} catch { sessionStatus = { currentMap: [], activeTokens: [] }; }

function saveDB(file, content) {
    fs.writeFileSync(file, JSON.stringify(content, null, 4));
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public", "views"));
app.use("/static", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.render("index"));

io.on("connection", socket => {
    const userId = socket.handshake.auth.userId;

    // cria player se não existir
    if (!players[userId]) {
        players[userId] = { id: userId, x: 300, y: 300 };
        saveDB(DB_FILE, players);
    }

    socket.emit("currentPlayers", players);
    socket.emit("mapList", maps);
    socket.emit("sessionStatus", sessionStatus);

    sessionStatus.activeTokens.forEach(t => {
        socket.emit("sessionUpdateActiveTokens", t);
    });

    socket.broadcast.emit("newPlayer", players[userId]);

    socket.on('addToken', (data) => {
        sessionStatus.activeTokens.push(data);
        saveDB(SESSION_FILE, sessionStatus);

        io.emit('sessionUpdateActiveTokens', data);
    });

    socket.on('updateMap', (data /* Mapa */) => {
        sessionStatus.currentMap = data;
        saveDB(SESSION_FILE, sessionStatus);

        io.emit('updateSessionMap', data);
    }); 

    socket.on("playerMove", (data) => {
        const { id, x, y } = data;

        // se for player
        if (players[id]) {
            players[id].x = x;
            players[id].y = y;
            saveDB(DB_FILE, players);
        }

        // se for token
        const token = sessionStatus.activeTokens.find(t => t.id === id);
        if (token) {
            token.x = x;
            token.y = y;
            saveDB(SESSION_FILE, sessionStatus);
        }

        io.emit("updatePlayer", { id, x, y });
    });

    socket.on("disconnect", () => {
        io.emit("playerDisconnect", userId);
    });
});

server.listen(PORT, () =>
    console.log("Server running → http://localhost:" + PORT)
);