export class Movement {
  constructor(speed = 100) {
    this.entity = null;
    this.speed = speed;
    this.vx = 0;
    this.vy = 0;
    this.directionChangeTimer = 0;
    this.directionChangeInterval = 2;
    this.randomizeDirection();
  }

  randomizeDirection() {
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle);
    this.vy = Math.sin(angle);
  }

  update() {
    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    this.directionChangeTimer += game.deltaTime;
    if (this.directionChangeTimer >= this.directionChangeInterval) {
      this.randomizeDirection();
      this.directionChangeTimer = 0;
      this.directionChangeInterval = 1 + Math.random() * 3;
    }

    transform.x += this.vx * this.speed * game.deltaTime;
    transform.y += this.vy * this.speed * game.deltaTime;

    if (transform.x < 0) transform.x = 1920;
    if (transform.x > 1920) transform.x = 0;
    if (transform.y < 0) transform.y = 1080;
    if (transform.y > 1080) transform.y = 0;
  }
}
