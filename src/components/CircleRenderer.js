export class CircleRenderer {
  constructor(radius = 20, color = '#ffffff') {
    this.entity = null;
    this.radius = radius;
    this.color = color;
  }

  render() {
    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    game.graphics.circle(
      transform.x,
      transform.y,
      this.radius * transform.scale,
      this.color
    );
  }
}
