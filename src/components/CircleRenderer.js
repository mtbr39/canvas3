export class CircleRenderer {
  constructor(radius = 20, color = '#ffffff') {
    this.entity = null;
    this.radius = radius;
    this.color = color;
  }

  render(context) {
    const { ctx } = context;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    ctx.beginPath();
    ctx.arc(transform.x, transform.y, this.radius * transform.scale, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
