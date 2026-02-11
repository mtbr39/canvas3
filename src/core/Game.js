import { Graphics } from './Graphics.js';
import { Camera } from './Camera.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = new Camera(canvas);
    this.graphics = new Graphics(this.ctx, this.camera);
    this.entities = [];
    this.lastTime = 0;
    this.running = false;
    this.deltaTime = 0;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(dpr, dpr);
    this.graphics.updateScale();
  }

  addEntity(entity) {
    entity.game = this;
    this.entities.push(entity);
    return this;
  }

  update(deltaTime) {
    this.deltaTime = deltaTime;

    for (const entity of this.entities) {
      entity.update();
    }

    this.removeMarkedEntities();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.camera.apply(this.ctx);

    for (const entity of this.entities) {
      entity.render();
    }

    this.camera.restore(this.ctx);
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

  // Spatial query system
  findNearbyEntities(centerX, centerY, radius, filterFn = null) {
    const nearby = [];
    for (const entity of this.entities) {
      const transform = entity.getComponent('transform');
      if (!transform) continue;
      const dx = transform.x - centerX;
      const dy = transform.y - centerY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radius * radius) {
        if (!filterFn || filterFn(entity)) {
          nearby.push({ entity, distance: Math.sqrt(distSq) });
        }
      }
    }
    nearby.sort((a, b) => a.distance - b.distance);
    return nearby;
  }

  findNearbyByTag(centerX, centerY, radius, tag) {
    return this.findNearbyEntities(centerX, centerY, radius, (entity) => {
      const tagComp = entity.getComponent('tag');
      return tagComp && tagComp.tag === tag;
    });
  }

  // Entity removal system
  markEntityForRemoval(entity) {
    if (!this.entitiesToRemove) this.entitiesToRemove = [];
    if (!this.entitiesToRemove.includes(entity)) {
      this.entitiesToRemove.push(entity);
    }
  }

  removeMarkedEntities() {
    if (!this.entitiesToRemove || this.entitiesToRemove.length === 0) return;
    for (const entity of this.entitiesToRemove) {
      const index = this.entities.indexOf(entity);
      if (index !== -1) this.entities.splice(index, 1);
    }
    this.entitiesToRemove = [];
  }
}
