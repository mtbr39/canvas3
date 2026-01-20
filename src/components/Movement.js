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

  update(context) {
    const { deltaTime, canvas } = context;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    this.directionChangeTimer += deltaTime;
    if (this.directionChangeTimer >= this.directionChangeInterval) {
      this.randomizeDirection();
      this.directionChangeTimer = 0;
      this.directionChangeInterval = 1 + Math.random() * 3;
    }

    transform.x += this.vx * this.speed * deltaTime;
    transform.y += this.vy * this.speed * deltaTime;

    if (transform.x < 0) transform.x = canvas.width;
    if (transform.x > canvas.width) transform.x = 0;
    if (transform.y < 0) transform.y = canvas.height;
    if (transform.y > canvas.height) transform.y = 0;
  }
}
