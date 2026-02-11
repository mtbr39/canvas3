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
    const radius = this.entity.getComponent('circleRenderer')?.radius || 25;

    game.graphics.text(
      transform.x,
      transform.y - radius - 20,
      this.text,
      {
        fill: `rgba(0, 0, 0, ${alpha})`,
        fontSize: 16
      }
    );
  }
}
