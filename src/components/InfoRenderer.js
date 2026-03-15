export class InfoRenderer {
  constructor() {
    this.entity = null;
  }

  render() {
    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    const health = this.entity.getComponent('health');
    if (!transform || !health) return;

    const collider = this.entity.getComponent('collider');
    let offsetY = 25;
    if (collider) {
      offsetY = collider.shape.type === 'circle'
        ? collider.shape.radius
        : collider.shape.height / 2;
    }

    const lines = [
      `HP ${health.currentHealth}/${health.maxHealth}`,
    ];

    if (game.debug) {
      const behavior = this.entity.getComponent('behavior');
      if (behavior && behavior.currentState) lines.push(behavior.currentState.constructor.name);

      const nutrition = this.entity.getComponent('nutrition');
      if (nutrition) lines.push(`栄養 ${Math.floor(nutrition.current)}/${nutrition.max}`);

      const vitality = this.entity.getComponent('vitality');
      if (vitality) lines.push(`気力 ${Math.floor(vitality.current)}/${vitality.max}`);
    }

    const lineHeight = 14;
    lines.forEach((line, i) => {
      game.graphics.text(
        transform.x,
        transform.y + offsetY + 10 + i * lineHeight,
        line,
        { fill: '#000000', fontSize: 12 }
      );
    });
  }
}
