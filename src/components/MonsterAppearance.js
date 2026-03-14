const PALETTE = [
  '#f8f8f8', '#ffffff', '#2c2c2c', '#1a1a1a',
  '#8b4513', '#d2b48c', '#ffd700', '#ffeb3b', '#daa520', '#a0522d'
];
const TYPES = ['circle', 'rect', 'triangle'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class MonsterAppearance {
  constructor() {
    this.entity = null;
    this.visible = true;
    this.flashTimer = 0;
    this.flashSpeed = 10;
    this.parts = MonsterAppearance.generateParts();
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
    const collider = this.entity.getComponent('collider');
    if (!transform || !collider) return;

    const r = collider.shape.radius;
    const { x, y, direction } = transform;
    const angle = direction + Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (const part of this.parts) {
      const px = x + (part.offsetX * cos - part.offsetY * sin) * r;
      const py = y + (part.offsetX * sin + part.offsetY * cos) * r;
      const pr = part.sizeRatio * r;
      const opts = part.isFill
        ? { fill: part.color }
        : { stroke: part.color, strokeWidth: part.strokeWidth || 2 };

      if (part.type === 'circle') {
        game.graphics.circle(px, py, pr, opts);
      } else if (part.type === 'rect') {
        game.graphics.rect(px, py, pr * 2, pr * 2, opts);
      } else if (part.type === 'triangle') {
        game.graphics.triangle(px, py, pr, { ...opts, rotation: (part.rotation || 0) + angle });
      }
    }
  }

  static generateParts() {
    const parts = [];

    // 胴体（塗り + 輪郭）
    const bodyType = 'circle';
    const bodyColor = pick(PALETTE);
    parts.push({ type: bodyType, color: bodyColor, sizeRatio: 1.0, offsetX: 0, offsetY: 0, isFill: true });
    parts.push({ type: bodyType, color: bodyColor, sizeRatio: 1.0, offsetX: 0, offsetY: 0, isFill: false, strokeWidth: 2 });

    // 頭（胴体より小さく、上に配置）
    const headType = pick(TYPES);
    const headSizeRatio = 0.4 + Math.random() * 0.4;
    const headOffsetY = -0.6 - Math.random() * 0.3;
    parts.push({ type: headType, color: bodyColor, sizeRatio: headSizeRatio, offsetX: 0, offsetY: headOffsetY, isFill: true });

    // 耳（三角形、頭の左右に対称配置・トンガリが後ろを向く）
    const earColor = pick(PALETTE);
    const earSizeRatio = 0.2 + Math.random() * 0.2;
    const earOffsetX = 0.2 + Math.random() * 0.2;
    const earOffsetY = headOffsetY + (Math.random() - 0.5) * 0.2;
    parts.push({ type: 'triangle', color: earColor, sizeRatio: earSizeRatio, offsetX: -earOffsetX, offsetY: earOffsetY, isFill: true, rotation: Math.PI / 2 - Math.PI / 8 });
    parts.push({ type: 'triangle', color: earColor, sizeRatio: earSizeRatio, offsetX:  earOffsetX, offsetY: earOffsetY, isFill: true, rotation: Math.PI / 2 + Math.PI / 8 });

    // 尻尾（1〜3個、下に配置）
    const tailType = pick(TYPES);
    const tailCount = 1 + Math.floor(Math.random() * 3);
    const tailSizeRatio = 0.2 + Math.random() * 0.2;
    for (let i = 0; i < tailCount; i++) {
      parts.push({
        type: tailType,
        color: bodyColor,
        sizeRatio: tailSizeRatio * (0.8 + i * 0.1),
        offsetX: 0,
        offsetY: 0.6 + i * 0.4,
        isFill: true
      });
    }

    return parts;
  }
}
