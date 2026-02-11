export class Projectile {
  constructor(dirX, dirY, speed) {
    this.entity = null;
    this.dirX = dirX;
    this.dirY = dirY;
    this.speed = speed;
  }

  update() {
    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');

    if (transform) {
      transform.x += this.dirX * this.speed * game.deltaTime;
      transform.y += this.dirY * this.speed * game.deltaTime;
    }
  }
}
