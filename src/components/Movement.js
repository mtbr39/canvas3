export class Movement {
  constructor(speed = 100) {
    this.entity = null;
    this.speed = speed;
    this.targetX = null;
    this.targetY = null;
    this.moving = false;
  }

  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.moving = true;
  }

  stop() {
    this.targetX = null;
    this.targetY = null;
    this.moving = false;
  }

  hasArrived() {
    return !this.moving;
  }

  update() {
    if (!this.moving) return;

    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    const dx = this.targetX - transform.x;
    const dy = this.targetY - transform.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.speed * game.deltaTime;

    if (dist <= step) {
      transform.x = this.targetX;
      transform.y = this.targetY;
      this.stop();
      return;
    }

    transform.x += (dx / dist) * step;
    transform.y += (dy / dist) * step;
  }
}
