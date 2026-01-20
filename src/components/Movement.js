export class Movement {
  constructor(speed = 100) {
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

  update(transform, deltaTime, canvasWidth, canvasHeight) {
    this.directionChangeTimer += deltaTime;
    if (this.directionChangeTimer >= this.directionChangeInterval) {
      this.randomizeDirection();
      this.directionChangeTimer = 0;
      this.directionChangeInterval = 1 + Math.random() * 3;
    }

    transform.x += this.vx * this.speed * deltaTime;
    transform.y += this.vy * this.speed * deltaTime;

    if (transform.x < 0) transform.x = canvasWidth;
    if (transform.x > canvasWidth) transform.x = 0;
    if (transform.y < 0) transform.y = canvasHeight;
    if (transform.y > canvasHeight) transform.y = 0;
  }
}
