import { colors } from '../data/Colors.js';

export class FloatingText {
  constructor() {
    this.entity = null;
    this.text = '';
    this.duration = 1.0;
    this.timer = 0;
  }

  show(text) {
    this.text = text;
    this.timer = this.duration;
  }

  update() {
    if (this.timer > 0) {
      const game = this.entity.game;
      this.timer -= game.deltaTime;
      if (this.timer < 0) this.timer = 0;
    }
  }

  render() {
    if (this.timer <= 0) return;

    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    const alpha = Math.min(1, this.timer / this.duration);

    const collider = this.entity.getComponent('collider');
    let offsetY = 25;
    if (collider) {
      offsetY = collider.shape.type === 'circle'
        ? collider.shape.radius
        : collider.shape.height / 2;
    }

    game.graphics.text(
      transform.x,
      transform.y - offsetY - 20,
      this.text,
      {
        fill: colors.textColor.replace(/^#(..)(..)(..)$/, (_, r, g, b) =>
          `rgba(${parseInt(r,16)}, ${parseInt(g,16)}, ${parseInt(b,16)}, ${alpha})`),
        fontSize: 14
      }
    );
  }
}
