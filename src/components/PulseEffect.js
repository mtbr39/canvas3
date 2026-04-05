export class PulseEffect {
  constructor() {
    this.entity = null;
    this.timer = 0;
    this.duration = 3;
    this.maxRadius = 200;
    this.colorRgb = '220, 70, 70';
  }

  show(options = {}) {
    if (options.duration  !== undefined) this.duration  = options.duration;
    if (options.maxRadius !== undefined) this.maxRadius = options.maxRadius;
    if (options.colorRgb  !== undefined) this.colorRgb  = options.colorRgb;
    this.timer = this.duration;
  }

  update() {
    if (this.timer <= 0) return;
    this.timer -= this.entity.game.deltaTime;
    if (this.timer <= 0) this.entity.removeComponent('pulseEffect');
  }

  render() {
    if (this.timer <= 0) return;

    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    const progress = 1 - this.timer / this.duration;
    const radius = this.maxRadius * progress;
    const alpha = (1 - progress) * 0.8;

    this.entity.game.graphics.circle(transform.x, transform.y, radius, {
      stroke: `rgba(${this.colorRgb}, ${alpha.toFixed(2)})`,
      strokeWidth: 4,
      strokeScaleWithZoom: false,
    });
  }
}
