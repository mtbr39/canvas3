export class CircleRenderer {
  constructor(radius = 20, options = {}) {
    this.entity = null;
    this.radius = radius;
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
    if (!transform) return;

    game.graphics.circle(
      transform.x,
      transform.y,
      this.radius,
      this.options
    );
  }
}
