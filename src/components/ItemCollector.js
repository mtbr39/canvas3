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

    const dx = itemEntity.x - this.entity.x;
    const dy = itemEntity.y - this.entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.pickupRange) return false;

    if (inventory.add(itemEntity)) {
      itemEntity.x = -9999;
      itemEntity.y = -9999;
      return true;
    }
    return false;
  }

  update() {
    if (!this.autoPickup) return;

    const spatialQuery = this.entity.game.spatialQuery;
    if (!spatialQuery) return;

    const nearbyEntities = spatialQuery.queryRadius(
      this.entity.x,
      this.entity.y,
      this.pickupRange
    );

    for (const entity of nearbyEntities) {
      if (entity === this.entity) continue;

      const itemInfo = entity.getComponent('itemInfo');
      if (itemInfo && itemInfo.canPickup()) {
        if (this.tryPickup(entity)) {
          break;
        }
      }
    }
  }
}

export default ItemCollector;
