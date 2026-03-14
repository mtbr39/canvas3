import createItem from '../entities/Item.js';

export class Loot {
  constructor() {
    this.entity = null;
    this.drops = ['hide', 'meat'];
  }

  drop() {
    if (!this.entity || !this.entity.game) return;

    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    for (const itemType of this.drops) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      const item = createItem(transform.x + offsetX, transform.y + offsetY, itemType);
      if (item) {
        this.entity.game.addEntity(item);
      }
    }
  }
}
