import { colors } from '../data/Colors.js';

export class LocationLabel {
  constructor() {
    this.entity = null;
    this.name = '';
  }

  render() {
    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    const collider = this.entity.getComponent('collider');
    if (!transform || !collider) return;

    const halfW = collider.shape.width / 2;
    const halfH = collider.shape.height / 2;

    game.graphics.text(
      transform.x - halfW,
      transform.y - halfH - 8,
      this.name,
      {
        fill: colors.textColor,
        fontSize: 14,
        align: 'left',
        baseline: 'bottom'
      }
    );
  }
}
