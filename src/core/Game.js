import { Graphics } from './Graphics.js';
import { Camera } from './Camera.js';
import { SpatialQuery } from './SpatialQuery.js';
import { colors } from '../data/Colors.js';

export class Game {
  constructor(canvas = null) {
    this.canvas = canvas;
    this.entities = [];
    this.registry = new Map();
    this.spatialQuery = new SpatialQuery(this);
    this.lastTime = 0;
    this.running = false;
    this.deltaTime = 0;
    this.debug = false;

    if (canvas) {
      this.ctx = canvas.getContext('2d');
      this.camera = new Camera(canvas);
      this.graphics = new Graphics(this.ctx, this.camera);
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.canvas.style.backgroundColor = colors.backgroundColor;
    this.ctx.scale(dpr, dpr);
    this.graphics.updateScale();
  }

  register(name, service) {
    service.game = this;
    this.registry.set(name, service);
    return this;
  }

  addEntity(entity) {
    entity.game = this;
    this.entities.push(entity);
    return this;
  }

  update(deltaTime) {
    this.deltaTime = deltaTime;

    for (const service of this.registry.values()) {
      if (service.update) service.update();
    }

    for (const entity of this.entities) {
      entity.update();
    }

    this.removeMarkedEntities();
  }

  render() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

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
