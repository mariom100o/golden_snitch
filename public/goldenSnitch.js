const LINEGAP = 100;
class GoldenSnitchGame {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    /** @type {HTMLCanvasElement} */
    this.ctx = ctx;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.playerId;

    this.input = { up: false, down: false, left: false, right: false };
    window.addEventListener("keydown", (e) => {
      if (e.key === "w") this.input.up = true;
      if (e.key === "s") this.input.down = true;
      if (e.key === "a") this.input.left = true;
      if (e.key === "d") this.input.right = true;

      socket.emit("playerInput", this.input);
    });
    window.addEventListener("keyup", (e) => {
      if (e.key === "w") this.input.up = false;
      if (e.key === "s") this.input.down = false;
      if (e.key === "a") this.input.left = false;
      if (e.key === "d") this.input.right = false;
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

  drawGrid(playerPos) {
    this.ctx.globalAlpha = 0.5;
    ctx.fillStyle = "grey";

    // Vert lines
    for (let x = playerPos.x; x < this.canvas.width; x += LINEGAP) {
      ctx.beginPath();
      ctx.moveTo(x, 0); // Move the pen to (30, 50)
      ctx.lineTo(x, this.canvas.height); // Draw a line to (150, 100)
      ctx.stroke(); // Render the path
    }
    for (let y = playerPos.y; y < this.canvas.height; y += LINEGAP) {
      ctx.beginPath();
      ctx.moveTo(0, y); // Move the pen to (30, 50)
      ctx.lineTo(this.canvas.width, y); // Draw a line to (150, 100)
      ctx.stroke(); // Render the path
    }
  }

  draw(state) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // this.drawGrid(state.playerPos);
    // this.drawPlayers(state.nearbyPlayers);
    if (state.relativeSnitch.x && state.relativeSnitch.y)
      this.drawSnitch(state.relativeSnitch);
  }

  drawPlayers(players) {
    for (let player of players) {
      if (player.id === this.playerId) {
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(
          this.canvas.width / 2 + (player.x - player.size / 2),
          this.canvas.height / 2 + (player.y - player.size / 2),
          player.size,
          player.size
        );
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

socket.on("id", (id) => {
  game.playerId = id;
});

socket.on("gameState", (state) => {
  game.draw(state);
});

socket.on("gameEnd", (winner) => {
  game.handleWin(winner);
});
