export class TextRenderer {
  constructor() {
    this.entity = null;
  }

  render() {
    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    const health = this.entity.getComponent('health');
    if (!transform || !health) return;

    const text = `${health.currentHealth}/${health.maxHealth}`;
    const offsetY = this.entity.getComponent('circleRenderer')?.radius || 25;

    game.graphics.text(
      transform.x,
      transform.y + offsetY + 10,
      text,
      {
        fill: '#000000',
        fontSize: 12
      }
    );
  }
}
