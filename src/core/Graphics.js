const REF_AREA = 1920 * 1080;

export class Graphics {
  constructor(ctx) {
    this.ctx = ctx;
    this.updateScale();
  }

  updateScale() {
    const area = this.ctx.canvas.width * this.ctx.canvas.height;
    this.scale = area / REF_AREA;
  }

  circle(x, y, radius, color) {
    this.ctx.beginPath();
    this.ctx.arc(x * this.scale, y * this.scale, radius * this.scale, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.closePath();
  }
}
