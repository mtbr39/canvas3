import { ITEMS } from '../data/Items.js';
import { colors } from '../data/Colors.js';

export class ItemInfoRenderer {
  constructor() {
    this.entity = null;
  }

  render() {
    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    const itemInfo = this.entity.getComponent('itemInfo');
    if (!transform || !itemInfo) return;

    const itemData = ITEMS[itemInfo.itemType];
    if (!itemData) return;

    const collider = this.entity.getComponent('collider');
    let offsetY = 8;
    if (collider) {
      offsetY = collider.shape.type === 'circle'
        ? collider.shape.radius
        : collider.shape.height / 2;
    }

    const label = itemInfo.quantity > 1 ? `${itemData.name} x${itemInfo.quantity}` : itemData.name;
    game.graphics.text(
      transform.x,
      transform.y + offsetY + 8,
      label,
      {
        fill: colors.textColor,
        fontSize: 10,
        fontSizeScaleWithZoom: true
      }
    );
  }
}
