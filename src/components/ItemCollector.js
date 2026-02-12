import { FollowOwner } from './FollowOwner.js';

class ItemCollector {
  constructor() {
    this.entity = null;
    this.pickupRange = 30;
    this.autoPickup = false;
  }

  tryPickup(itemEntity) {
    const itemInfo = itemEntity.getComponent('itemInfo');
    if (!itemInfo || !itemInfo.canPickup()) return false;

    const inventory = this.entity.getComponent('inventory');
    if (!inventory || inventory.isFull()) return false;

    const transform = this.entity.getComponent('transform');
    const itemTransform = itemEntity.getComponent('transform');
    if (!transform || !itemTransform) return false;

    const dx = itemTransform.x - transform.x;
    const dy = itemTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.pickupRange) return false;

    if (inventory.add(itemEntity)) {
      itemInfo.setOwner(this.entity);

      const followOwner = itemEntity.getComponent('followOwner');
      if (!followOwner) {
        itemEntity.addComponent('followOwner', new FollowOwner());
      }

      const itemIndex = inventory.items.indexOf(itemEntity);
      const cols = 2;
      const rowIndex = Math.floor(itemIndex / cols);
      const colIndex = itemIndex % cols;

      const rowDistance = 30 + rowIndex * 25;
      const colSpacing = 20;
      const colOffset = (colIndex - (cols - 1) / 2) * colSpacing;

      itemEntity.getComponent('followOwner').setOwner(this.entity, rowDistance, colOffset);

      return true;
    }
    return false;
  }

  update() {
    if (!this.autoPickup) return;

    const spatialQuery = this.entity.game.spatialQuery;
    if (!spatialQuery) return;

    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    const nearbyResults = spatialQuery.findNearbyEntities(
      this.entity.game.entities,
      transform.x,
      transform.y,
      this.pickupRange,
      (e) => {
        if (e === this.entity) return false;
        const itemInfo = e.getComponent('itemInfo');
        return itemInfo && itemInfo.canPickup();
      }
    );

    for (const result of nearbyResults) {
      if (this.tryPickup(result.entity)) {
        break;
      }
    }
  }
}

export default ItemCollector;
