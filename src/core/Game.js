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
    for (const entity of this.entities) {
      if (entity.hasComponent('movement') && entity.hasComponent('transform')) {
        const movement = entity.getComponent('movement');
        const transform = entity.getComponent('transform');
        movement.update(transform, deltaTime, this.canvas.width, this.canvas.height);
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const entity of this.entities) {
      if (entity.hasComponent('circleRenderer') && entity.hasComponent('transform')) {
        const renderer = entity.getComponent('circleRenderer');
        const transform = entity.getComponent('transform');
        renderer.render(this.ctx, transform);
      }
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
