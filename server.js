const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const canvasWidth = 700;
const canvasHeight = 700;

app.use(express.static(path.join(__dirname, "public")));

const colors = ["red", "blue", "green", "orange", "purple"];
let players = [];
let snitch = {
  x: 10,
  y: 10,
  radius: 10,
  xVel: 5,
  yVel: 5,
  canChangeDir: true,
};
io.on("connection", (socket) => {
  console.log("a user connected");
  io.to(socket.id).emit("init", {
    id: socket.id,
    gameWidth: canvasWidth,
    gameHeight: canvasHeight,
  });
  let color = colors.pop();
  players.push({
    id: socket.id,
    windowWidth: 0,
    windowHeight: 0,
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    size: 25,
    speed: 6.67,
    color: color,
    input: { up: false, down: false, left: false, right: false },
  });

  socket.on("windowInfo", (windowSize) => {
    let i = players.findIndex((item) => item.id === socket.id);
    players[i].windowWidth = windowSize.width;
    players[i].windowHeight = windowSize.height;
  });

  socket.on("playerInput", (input) => {
    players.find((item) => item.id === socket.id).input = input;
  });

  socket.on("disconnect", () => {
    let i = players.findIndex((item) => item.id === socket.id);
    colors.push(players[i].color);
    players.splice(i, 1);
    console.log("user disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

const updatePlayers = () => {
  for (let player of players) {
    if (player.input.up) player.y -= player.speed;
    if (player.input.down) player.y += player.speed;
    if (player.input.left) player.x -= player.speed;
    if (player.input.right) player.x += player.speed;

    // Put the player in bounds if it ever left
    if (player.x + player.size / 2 >= canvasWidth)
      player.x = canvasWidth - player.size / 2;

    if (player.x - player.size / 2 <= 0) player.x = player.size / 2;

    if (player.y + player.size / 2 >= canvasHeight)
      player.y = canvasHeight - player.size / 2;

    if (player.y - player.size / 2 <= 0) player.y = player.size / 2;
  }
};

let lastUpdate = new Date().getTime();
const updateSnitch = () => {
  if (new Date().getTime() - lastUpdate >= 250) {
    lastUpdate = new Date().getTime();
    // Get random velocity for x and y (-8 to 8)
    snitch.xVel =
      (Math.round(Math.random()) * 2 - 1) * Math.floor(Math.random() * 15 + 1);
    snitch.yVel =
      (Math.round(Math.random()) * 2 - 1) * Math.floor(Math.random() * 15 + 1);
  }
  // Inverse the velocity if the snitch is running into a wall
  if (snitch.yVel < 0 && snitch.y - snitch.radius <= 0) snitch.yVel *= -1;
  if (snitch.xVel < 0 && snitch.x - snitch.radius <= 0) snitch.xVel *= -1;
  if (snitch.yVel > 0 && snitch.y + snitch.radius >= canvasHeight)
    snitch.yVel *= -1;
  if (snitch.xVel > 0 && snitch.x + snitch.radius >= canvasWidth)
    snitch.xVel *= -1;
  // Inverse the velocity if the snitch is running into the player
  for (let player of players) {
    if (
      Math.sqrt(
        Math.pow(snitch.x - player.x, 2) + Math.pow(snitch.y - player.y, 2)
      ) <
      player.size + snitch.radius + 20
    ) {
      if (snitch.y > player.y && snitch.yVel < 0) snitch.yVel *= -1;
      if (snitch.y < player.y && snitch.yVel > 0) snitch.yVel *= -1;
      if (snitch.x > player.x && snitch.xVel < 0) snitch.xVel *= -1;
      if (snitch.x < player.x && snitch.xVel > 0) snitch.xVel *= -1;
    }
  }
  snitch.x += snitch.xVel;
  snitch.y += snitch.yVel;
  // Put the snitch in bounds if it ever left
  if (snitch.x - snitch.radius < 0) snitch.x = snitch.radius;
  if (snitch.x + snitch.radius > canvasWidth)
    snitch.x = canvasWidth - snitch.radius;
  if (snitch.y - snitch.radius < 0) snitch.y = snitch.radius;
  if (snitch.y + snitch.radius > canvasHeight)
    snitch.y = canvasHeight - snitch.radius;
};

const checkWin = () => {
  for (let player of players) {
    if (
      snitch.x + snitch.radius >= player.x - player.size / 2 &&
      snitch.x - snitch.radius <= player.x + player.size / 2 &&
      snitch.y + snitch.radius >= player.y - player.size / 2 &&
      snitch.y - snitch.radius <= player.y + player.size / 2
    )
      return players.find((item) => item.id === player.id).color;
  }

  return -1;
};

let tickInterval;

const tick = () => {
  updatePlayers();
  updateSnitch();
  for (let player of players) {
    let temp = players.filter((item) => {
      if (
        item.x >= player.x - (player.windowWidth / 2 + 30) &&
        item.x <= player.x + (player.windowWidth / 2 + 30) &&
        item.y >= player.y - (player.windowHeight / 2 + 30) &&
        item.y <= player.y + (player.windowHeight / 2 + 30)
      )
        return true;
    });
    let nearbyPlayers = temp.filter((it) => true).map((obj) => ({ ...obj }));
    // Define positions relative to the current player
    for (let nearbyPlayer of nearbyPlayers) {
      nearbyPlayer.x -= player.x;
      nearbyPlayer.y -= player.y;
    }
    let relativeSnitch = {};
    if (
      snitch.x >= player.x - (player.windowWidth / 2 + 30) &&
      snitch.x <= player.x + (player.windowWidth / 2 + 30) &&
      snitch.y >= player.y - (player.windowHeight / 2 + 30) &&
      snitch.y <= player.y + (player.windowHeight / 2 + 30)
    ) {
      relativeSnitch.x = snitch.x - player.x;
      relativeSnitch.y = snitch.y - player.y;
      relativeSnitch.radius = snitch.radius;
    }
    io.to(player.id).emit("gameState", {
      player: { x: player.x, y: player.y, size: player.size },
      nearbyPlayers: nearbyPlayers,
      relativeSnitch: relativeSnitch,
    });
  }
  let winner = checkWin();
  if (winner != -1) handleWin(winner);
};

const startGame = () => {
  tickInterval = setInterval(() => tick(), 1000 / 60);
};
const handleWin = (id) => {
  clearInterval(tickInterval);
  for (let player of players) {
    player.x = canvasWidth / 2;
    player.y = canvasHeight / 2;
    player.size = 25;
    player.speed = 4;
    player.input = { up: false, down: false, left: false, right: false };
  }
  snitch = {
    x: 10,
    y: 10,
    radius: 10,
    xVel: 8,
    yVel: 8,
    canChangeDir: true,
  };
  io.emit("gameEnd", id);
  setTimeout(() => startGame(), 3000);
};

startGame();

// Make players a map from ID -> everythin else
