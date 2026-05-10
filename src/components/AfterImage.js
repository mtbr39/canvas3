const SAMPLE_INTERVAL = 0.025;
const IMAGE_LIFETIME = 0.3;

export class AfterImage {
  constructor() {
    this.entity = null;
    this.active = false;
    this.activeTimer = 0;
    this.sampleTimer = 0;
    this.images = [];
  }

  trigger(duration = 0.2) {
    this.active = true;
    this.activeTimer = duration;
    this.sampleTimer = 0;
  }

  update() {
    const game = this.entity.game;
    const dt = game.deltaTime;

    if (this.active) {
      this.activeTimer -= dt;
      this.sampleTimer -= dt;
      if (this.sampleTimer <= 0) {
        this._sample();
        this.sampleTimer = SAMPLE_INTERVAL;
      }
      if (this.activeTimer <= 0) this.active = false;
    }

    for (const img of this.images) img.age += dt;
    this.images = this.images.filter(img => img.age < IMAGE_LIFETIME);
  }

  _sample() {
    const transform = this.entity.getComponent('transform');
    if (!transform) return;
    this.images.push({ x: transform.x, y: transform.y, age: 0 });
  }

  render() {
    if (this.images.length === 0) return;
    const game = this.entity.game;
    const collider = this.entity.getComponent('collider');
    const shapeRenderer = this.entity.getComponent('shapeRenderer');
    if (!collider || collider.shape.type !== 'circle') return;

    const baseFill = shapeRenderer?.options?.fill ?? '#ffffff';
    const rgb = this._hexToRgb(baseFill);

    for (const img of this.images) {
      const t = img.age / IMAGE_LIFETIME;
      const alpha = (1 - t) * 0.5;
      game.graphics.circle(img.x, img.y, collider.shape.radius, {
        fill: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`,
      });
    }
  }

  _hexToRgb(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!m) return { r: 255, g: 255, b: 255 };
    return {
      r: parseInt(m[1], 16),
      g: parseInt(m[2], 16),
      b: parseInt(m[3], 16),
    };
  }
}
