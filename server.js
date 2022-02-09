const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

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
  let color = colors.pop();
  players.push({
    id: socket.id,
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    size: 25,
    speed: 4,
    color: color,
    input: { up: false, down: false, left: false, right: false },
  });

  socket.on("playerInput", (input) => {
    players.find((item) => item.id === socket.id).input = input;
  });

  socket.on("disconnect", () => {
    let i = players.findIndex((item) => item.id === socket.id);
    players.splice(i, 1);
    console.log("user disconnected");
  });
});

server.listen(8080, () => {
  console.log("listening on *:3000");
});

const canvasWidth = 1000;
const canvasHeight = 1000;

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

const startSnitchTimeout = () => {
  snitch.canChangeDir = false;
  setTimeout(() => {
    snitch.canChangeDir = true;
  }, 250);
};

const updateSnitch = () => {
  if (snitch.canChangeDir) {
    startSnitchTimeout();
    // Get random velocity for x and y (-8 to 8)
    snitch.xVel =
      (Math.round(Math.random()) * 2 - 1) * Math.floor(Math.random() * 1 + 1);
    snitch.yVel =
      (Math.round(Math.random()) * 2 - 1) * Math.floor(Math.random() * 1 + 1);
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

let tick;

const startGame = () => {
  tick = setInterval(() => {
    updatePlayers();
    updateSnitch();
    io.emit("gameState", { players: players, snitch: snitch });
    let winner = checkWin();
    if (winner != -1) handleWin(winner);
  }, 10);
};
const handleWin = (id) => {
  console.log(tick);
  clearInterval(tick);
  io.emit("gameEnd", id);
};

startGame();
