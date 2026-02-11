const REF_AREA = 1920 * 1080;

export class Graphics {
  constructor(ctx, camera) {
    this.ctx = ctx;
    this.camera = camera;
    this.updateScale();
  }

  updateScale() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.ctx.canvas.width / dpr;
    const h = this.ctx.canvas.height / dpr;
    this.scale = (w * h) / REF_AREA;
  }

  circle(x, y, radius, options = {}) {
    const { fill, stroke, strokeWidth = 1, strokeScaleWithZoom = false } = options;

    this.ctx.beginPath();
    this.ctx.arc(x * this.scale, y * this.scale, radius * this.scale, 0, Math.PI * 2);

    if (fill) {
      this.ctx.fillStyle = fill;
      this.ctx.fill();
    }

    if (stroke) {
      this.ctx.strokeStyle = stroke;
      // デフォルトではズームに関わらず一定の太さ、strokeScaleWithZoom=trueでズームに連動
      const actualStrokeWidth = strokeScaleWithZoom
        ? strokeWidth
        : strokeWidth / this.camera.zoom;
      this.ctx.lineWidth = actualStrokeWidth;
      this.ctx.stroke();
    }

    this.ctx.closePath();
  }

  text(x, y, text, options = {}) {
    const {
      fill = '#ffffff',
      stroke,
      strokeWidth = 2,
      fontSize = 14,
      fontFamily = 'Arial',
      align = 'center',
      baseline = 'middle'
    } = options;

    // フォントサイズはズームに関係なく一定
    const actualFontSize = fontSize / this.camera.zoom;
    this.ctx.font = `${actualFontSize}px ${fontFamily}`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    const screenX = x * this.scale;
    const screenY = y * this.scale;

    if (stroke) {
      this.ctx.strokeStyle = stroke;
      this.ctx.lineWidth = strokeWidth / this.camera.zoom;
      this.ctx.strokeText(text, screenX, screenY);
    }

    this.ctx.fillStyle = fill;
    this.ctx.fillText(text, screenX, screenY);
  }
}
