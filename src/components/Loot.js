import createItem from '../entities/Item.js';
import { give } from './ItemExchanger.js';

export class Loot {
  constructor() {
    this.entity = null;
    this.drops = ['hide', 'meat'];
  }

  drop(attacker = null) {
    if (!this.entity || !this.entity.game) return;

    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    const attackerInventory = attacker?.getComponent('inventory');

    for (const itemType of this.drops) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      const item = createItem(transform.x + offsetX, transform.y + offsetY, itemType);
      if (!item) continue;

      if (attackerInventory && !attackerInventory.isFull()) {
        give(item, attackerInventory);
      } else {
        this.entity.game.addEntity(item);
      }
    }
  }
}
