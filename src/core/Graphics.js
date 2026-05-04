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

  triangle(x, y, radius, options = {}) {
    const { fill, stroke, strokeWidth = 1, strokeScaleWithZoom = false, rotation = 0 } = options;

    this.ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i + rotation;
      const px = x * this.scale + Math.cos(angle) * radius * this.scale;
      const py = y * this.scale + Math.sin(angle) * radius * this.scale;
      i === 0 ? this.ctx.moveTo(px, py) : this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();

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
  }

  polygon(x, y, vertices, options = {}) {
    const { fill, stroke, strokeWidth = 1, strokeScaleWithZoom = false } = options;

    if (!vertices || vertices.length < 3) return;

    this.ctx.beginPath();
    for (let i = 0; i < vertices.length; i++) {
      const px = (x + vertices[i].x) * this.scale;
      const py = (y + vertices[i].y) * this.scale;
      i === 0 ? this.ctx.moveTo(px, py) : this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();

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
  }

  polyline(points, options = {}) {
    const {
      stroke = '#ffffff',
      strokeWidth = 1,
      worldSpace = false,
      lineCap = 'round',
      lineJoin = 'round',
    } = options;

    if (!points || points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x * this.scale, points[0].y * this.scale);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x * this.scale, points[i].y * this.scale);
    }
    this.ctx.strokeStyle = stroke;
    this.ctx.lineCap = lineCap;
    this.ctx.lineJoin = lineJoin;
    this.ctx.lineWidth = worldSpace ? strokeWidth * this.scale : strokeWidth / this.camera.zoom;
    this.ctx.stroke();
  }

  line(x1, y1, x2, y2, options = {}) {
    const { stroke = '#ffffff', strokeWidth = 1, worldSpace = false } = options;
    this.ctx.beginPath();
    this.ctx.moveTo(x1 * this.scale, y1 * this.scale);
    this.ctx.lineTo(x2 * this.scale, y2 * this.scale);
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = worldSpace ? strokeWidth * this.scale : strokeWidth / this.camera.zoom;
    this.ctx.stroke();
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
