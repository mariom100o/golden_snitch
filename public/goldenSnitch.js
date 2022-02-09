class GoldenSnitchGame {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.canvas.width = 1000;
    this.canvas.height = 800;
    this.playerId;
    this.ctx.fillStyle = "lavender";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
  }

  draw(players, snitch) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "lavender";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawPlayers(players);
    this.drawSnitch(snitch);
  }

  drawPlayers(players) {
    for (let player of players) {
      if (player.id === this.playerId) {
        console.log(this.playerId);
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(
          player.x - player.size / 2,
          player.y - player.size / 2,
          player.size,
          player.size
        );
      } else {
        console.log("Other player");
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(
          player.x - player.size / 2,
          player.y - player.size / 2,
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
    this.ctx.arc(snitch.x, snitch.y, snitch.radius, 0, 2 * Math.PI);
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

const game = new GoldenSnitchGame(canvas, ctx);

const socket = io();

socket.on("id", (id) => {
  console.log(id);
  game.playerId = id;
});

socket.on("gameState", (state) => {
  game.draw(state.players, state.snitch);
});

socket.on("gameEnd", (winner) => {
  game.handleWin(winner);
});
