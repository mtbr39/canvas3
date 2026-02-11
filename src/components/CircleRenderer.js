export class CircleRenderer {
  constructor(radius = 20, options = {}) {
    this.entity = null;
    this.radius = radius;
    this.options = options;
  }

  render() {
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
