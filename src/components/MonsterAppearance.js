const PALETTE = [
  '#f8f8f8', '#ffffff', '#2c2c2c', '#1a1a1a',
  '#8b4513', '#d2b48c', '#ffd700', '#ffeb3b', '#daa520', '#a0522d'
];
const TYPES = ['circle', 'triangle'];

const HEAD = {
  sizeMin: 0.4, sizeRange: 0.8,
  offsetYMin: -1.9, offsetYRange: 1.3,
};
const EAR = {
  sizeMin: 0.2, sizeRange: 0.4,
  offsetXMin: 0.4, offsetXRange: 0.8,
  offsetYJitter: 0.2,
  rotationBase: Math.PI / 2,
  rotationSpread: Math.PI / 8,
};
const WING = {
  sizeMin: 1.0, sizeRange: 1.2,
  offsetXMin: 1.2, offsetXRange: 1.2,
  offsetYMin: -0.4, offsetYRange: 1.2,
  rotationMin: -Math.PI * 0.75, rotationRange: Math.PI * 1.5,
};
const TAIL = {
  countMin: 1, countRange: 5,
  sizeMin: 0.2, sizeRange: 0.4,
  offsetYBase: 0.6, offsetYStep: 0.6,
  sizeStepFactor: 0.1,
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class MonsterAppearance {
  constructor({ hasWings = false } = {}) {
    this.entity = null;
    this.visible = true;
    this.flashTimer = 0;
    this.flashSpeed = 10;
    this.parts = MonsterAppearance.generateParts({ hasWings });
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

  static generateParts({ hasWings = false } = {}) {
    const parts = [];

    // 胴体（塗り + 輪郭）
    const bodyType = 'circle';
    const bodyColor = pick(PALETTE);
    parts.push({ type: bodyType, color: bodyColor, sizeRatio: 1.0, offsetX: 0, offsetY: 0, isFill: true });
    parts.push({ type: bodyType, color: bodyColor, sizeRatio: 1.0, offsetX: 0, offsetY: 0, isFill: false, strokeWidth: 2 });

    // 頭（胴体より小さく、上に配置）
    const headType = pick(TYPES);
    const headSizeRatio = HEAD.sizeMin + Math.random() * HEAD.sizeRange;
    const headOffsetY = HEAD.offsetYMin + Math.random() * HEAD.offsetYRange;
    const headRotation = headType === 'triangle' ? -Math.PI / 2 : 0;
    parts.push({ type: headType, color: bodyColor, sizeRatio: headSizeRatio, offsetX: 0, offsetY: headOffsetY, isFill: true, rotation: headRotation });

    // 耳（三角形、頭の左右に対称配置・トンガリが後ろを向く）
    const earColor = pick(PALETTE);
    const earSizeRatio = EAR.sizeMin + Math.random() * EAR.sizeRange;
    const earOffsetX = EAR.offsetXMin + Math.random() * EAR.offsetXRange;
    const earOffsetY = headOffsetY + (Math.random() - 0.5) * EAR.offsetYJitter;
    parts.push({ type: 'triangle', color: earColor, sizeRatio: earSizeRatio, offsetX: -earOffsetX, offsetY: earOffsetY, isFill: true, rotation: EAR.rotationBase - EAR.rotationSpread });
    parts.push({ type: 'triangle', color: earColor, sizeRatio: earSizeRatio, offsetX:  earOffsetX, offsetY: earOffsetY, isFill: true, rotation: EAR.rotationBase + EAR.rotationSpread });

    // 翼（三角形、胴体の左右に対称配置）
    if (hasWings) {
      const wingSize = WING.sizeMin + Math.random() * WING.sizeRange;
      const wingOffsetX = WING.offsetXMin + Math.random() * WING.offsetXRange;
      const wingOffsetY = WING.offsetYMin + Math.random() * WING.offsetYRange;
      const wingRotationL = WING.rotationMin + Math.random() * WING.rotationRange;
      const wingRotationR = Math.PI - wingRotationL;
      parts.push({ type: 'triangle', color: bodyColor, sizeRatio: wingSize, offsetX: -wingOffsetX, offsetY: wingOffsetY, isFill: true, rotation: wingRotationL });
      parts.push({ type: 'triangle', color: bodyColor, sizeRatio: wingSize, offsetX:  wingOffsetX, offsetY: wingOffsetY, isFill: true, rotation: wingRotationR });
    }

    // 尻尾（1〜3個、下に配置）
    const tailType = pick(TYPES);
    const tailRotation = tailType === 'triangle' ? (Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2) : 0;
    const tailCount = TAIL.countMin + Math.floor(Math.random() * TAIL.countRange);
    const tailSizeRatio = TAIL.sizeMin + Math.random() * TAIL.sizeRange;
    for (let i = 0; i < tailCount; i++) {
      parts.push({
        type: tailType,
        color: bodyColor,
        sizeRatio: tailSizeRatio * (0.8 + i * TAIL.sizeStepFactor),
        offsetX: 0,
        offsetY: TAIL.offsetYBase + i * TAIL.offsetYStep,
        isFill: true,
        rotation: tailRotation
      });
    }

    return parts;
  }
}
