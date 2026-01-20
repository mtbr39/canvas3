export class CircleRenderer {
  constructor(radius = 20, color = '#ffffff') {
    this.radius = radius;
    this.color = color;
  }

  render(ctx, transform) {
    ctx.beginPath();
    ctx.arc(transform.x, transform.y, this.radius * transform.scale, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
