const REF_AREA = 1920 * 1080;

export class Graphics {
  constructor(ctx, camera) {
    this.ctx = ctx;
    this.camera = camera;
    this.updateScale();
  }

  updateScale() {
    this.dpr = window.devicePixelRatio || 1;
    const w = this.ctx.canvas.width / this.dpr;
    const h = this.ctx.canvas.height / this.dpr;
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
      const divisor = strokeScaleWithZoom ? this.dpr : this.camera.zoom * this.dpr;
      this.ctx.lineWidth = strokeWidth / divisor;
      this.ctx.stroke();
    }

    this.ctx.closePath();
  }

  rect(x, y, width, height, options = {}) {
    const { fill, stroke, strokeWidth = 1, strokeScaleWithZoom = false } = options;

    const screenX = x * this.scale - (width * this.scale) / 2;
    const screenY = y * this.scale - (height * this.scale) / 2;

    if (fill) {
      this.ctx.fillStyle = fill;
      this.ctx.fillRect(screenX, screenY, width * this.scale, height * this.scale);
    }

    if (stroke) {
      this.ctx.strokeStyle = stroke;
      const divisor = strokeScaleWithZoom ? this.dpr : this.camera.zoom * this.dpr;
      this.ctx.lineWidth = strokeWidth / divisor;
      this.ctx.strokeRect(screenX, screenY, width * this.scale, height * this.scale);
    }
  }

  text(x, y, text, options = {}) {
    const {
      fill = '#ffffff',
      stroke,
      strokeWidth = 2,
      fontSize = 14,
      fontSizeScaleWithZoom = false,
      fontFamily = 'Arial',
      align = 'center',
      baseline = 'middle'
    } = options;

    // デフォルトではズームに関わらず一定のサイズ、fontSizeScaleWithZoom=trueでズームに連動
    const actualFontSize = fontSizeScaleWithZoom
      ? fontSize
      : fontSize / this.camera.zoom;
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
