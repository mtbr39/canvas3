export class InfoRenderer {
  constructor() {
    this.entity = null;
  }

  render() {
    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    const health = this.entity.getComponent('health');
    if (!transform || !health) return;

    const text = `${health.currentHealth}/${health.maxHealth}`;

    const collider = this.entity.getComponent('collider');
    let offsetY = 25;
    if (collider) {
      offsetY = collider.shape.type === 'circle'
        ? collider.shape.radius
        : collider.shape.height / 2;
    }

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
