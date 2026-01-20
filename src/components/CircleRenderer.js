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

    game.ctx.beginPath();
    game.ctx.arc(transform.x, transform.y, this.radius * transform.scale, 0, Math.PI * 2);
    game.ctx.fillStyle = this.color;
    game.ctx.fill();
    game.ctx.closePath();
  }
}
