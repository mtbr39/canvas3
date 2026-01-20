export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = [];
    this.lastTime = 0;
    this.running = false;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  addEntity(entity) {
    this.entities.push(entity);
    return this;
  }

  update(deltaTime) {
    const context = {
      deltaTime,
      canvas: this.canvas,
      ctx: this.ctx
    };

    for (const entity of this.entities) {
      entity.update(context);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const context = {
      canvas: this.canvas,
      ctx: this.ctx
    };

    for (const entity of this.entities) {
      entity.render(context);
    }
  }

  gameLoop(currentTime) {
    if (!this.running) return;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  run() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  stop() {
    this.running = false;
  }
}
