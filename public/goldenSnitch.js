const LINEGAP = 100;
class GoldenSnitchGame {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    /** @type {HTMLCanvasElement} */
    this.ctx = ctx;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.playerId;
    this.gameWidth = 100;
    this.gameHeight = 100;

    this.input = { up: false, down: false, left: false, right: false };
    window.addEventListener("keydown", (e) => {
      let prevInput = { ...this.input };
      if (e.key === "w") this.input.up = true;
      if (e.key === "s") this.input.down = true;
      if (e.key === "a") this.input.left = true;
      if (e.key === "d") this.input.right = true;

      if (
        prevInput.up != this.input.up ||
        prevInput.down != this.input.down ||
        prevInput.left != this.input.left ||
        prevInput.right != this.input.right
      )
        socket.emit("playerInput", this.input);
    });
    window.addEventListener("keyup", (e) => {
      let prevInput = { ...this.input };
      if (e.key === "w") this.input.up = false;
      if (e.key === "s") this.input.down = false;
      if (e.key === "a") this.input.left = false;
      if (e.key === "d") this.input.right = false;

      if (
        prevInput.up != this.input.up ||
        prevInput.down != this.input.down ||
        prevInput.left != this.input.left ||
        prevInput.right != this.input.right
      )
        socket.emit("playerInput", this.input);
    });
    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      socket.emit("windowInfo", {
        width: window.innerWidth,
        height: window.innerHeight,
      });
    });
  }

  drawGrid(player) {
    this.ctx.globalAlpha = 0.5;
    ctx.fillStyle = "grey";

    let startX = this.canvas.width / 2 - player.x;
    if (startX < 0) -(startX %= 100);
    let endX = this.canvas.width / 2 + this.gameWidth - player.x;
    while (endX >= this.canvas.width + 100) endX -= 100;
    // if (endX > this.canvas.width) (endX %= 100) + this.canvas.width;

    let startY = this.canvas.height / 2 - player.y;
    if (startY < 0) -(startY %= 100);
    let endY = this.canvas.height / 2 + this.gameHeight - player.y;
    while (endY >= this.canvas.height + 100) endY -= 100;
    // if (endY > this.canvas.height) (endY %= 100) + this.canvas.height;
    // Vert lines
    for (let x = startX; x <= endX; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, startY); // Move the pen to (30, 50)
      ctx.lineTo(x, endY); // Draw a line to (150, 100)
      ctx.stroke(); // Render the path
    }
    // horiz lines
    for (let y = startY; y <= endY; y += 100) {
      ctx.beginPath();
      ctx.moveTo(startX, y); // Move the pen to (30, 50)
      ctx.lineTo(endX, y); // Draw a line to (150, 100)
      ctx.stroke(); // Render the path
    }
  }

  draw(state) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid(state.player);
    this.drawPlayers(state.nearbyPlayers);
    if (state.relativeSnitch.x && state.relativeSnitch.y)
      this.drawSnitch(state.relativeSnitch);
  }

  drawPlayers(players) {
    let myPlayer = {};
    for (let player of players) {
      if (player.id === this.playerId) {
        myPlayer = { ...player };
      } else {
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(
          this.canvas.width / 2 + (player.x - player.size / 2),
          this.canvas.height / 2 + (player.y - player.size / 2),
          player.size,
          player.size
        );
        this.ctx.globalAlpha = 1.0;
      }
    }

    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = myPlayer.color;
    this.ctx.fillRect(
      this.canvas.width / 2 + (myPlayer.x - myPlayer.size / 2),
      this.canvas.height / 2 + (myPlayer.y - myPlayer.size / 2),
      myPlayer.size,
      myPlayer.size
    );
  }

  drawSnitch(snitch) {
    this.ctx.fillStyle = "gold";
    this.ctx.beginPath();
    this.ctx.arc(
      this.canvas.width / 2 + snitch.x,
      this.canvas.height / 2 + snitch.y,
      snitch.radius,
      0,
      2 * Math.PI
    );
    this.ctx.fill();
    this.ctx.closePath();
  }

  handleWin(winner) {
    this.ctx.fillStyle = "black";
    this.ctx.font = "20px Serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      `${winner} caught the snitch!`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
  }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const socket = io();

const game = new GoldenSnitchGame(canvas, ctx);

socket.emit("windowInfo", {
  width: window.innerWidth,
  height: window.innerHeight,
});

socket.on("init", (info) => {
  game.playerId = info.id;
  game.gameWidth = info.gameWidth;
  game.gameHeight = info.gameHeight;
});

socket.on("gameState", (state) => {
  game.draw(state);
});

socket.on("gameEnd", (winner) => {
  game.handleWin(winner);
});

// TODO: Only send key up/down updates
