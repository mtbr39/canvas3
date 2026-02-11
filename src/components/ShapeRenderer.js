export class ShapeRenderer {
  constructor(options = {}) {
    this.entity = null;
    this.options = options;
    this.visible = true;
    this.flashTimer = 0;
    this.flashSpeed = 10;
  }

  flash(duration = 0.5) {
    this.flashTimer = duration;
  }

  update() {
    if (this.flashTimer > 0) {
      const game = this.entity.game;
      this.flashTimer -= game.deltaTime;

      const cycle = Math.floor(this.flashTimer * this.flashSpeed);
      this.visible = cycle % 2 === 0;

      if (this.flashTimer <= 0) {
        this.flashTimer = 0;
        this.visible = true;
      }
    }
  }

  render() {
    if (!this.visible) return;

    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    const collider = this.entity.getComponent('collider');
    if (!transform || !collider) return;

    if (collider.shape.type === 'circle') {
      game.graphics.circle(
        transform.x,
        transform.y,
        collider.shape.radius,
        this.options
      );
    } else if (collider.shape.type === 'rect') {
      game.graphics.rect(
        transform.x,
        transform.y,
        collider.shape.width,
        collider.shape.height,
        this.options
      );
    }
  }
}
