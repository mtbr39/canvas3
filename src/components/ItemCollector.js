class ItemCollector {
  constructor() {
    this.entity = null;
    this.pickupRange = 30;
    this.searchRange = 200;
    this.autoPickup = false;
  }

  findNearbyItem() {
    const transform = this.entity.getComponent('transform');
    const inventory = this.entity.getComponent('inventory');
    if (!transform || !inventory || inventory.isFull()) return null;

    const results = this.entity.game.spatialQuery.findNearbyEntities(
      this.entity.game.entities,
      transform.x, transform.y,
      this.searchRange,
      (e) => {
        if (e === this.entity) return false;
        const itemInfo = e.getComponent('itemInfo');
        return itemInfo && itemInfo.canPickup();
      }
    );

    return results.length > 0 ? results[0].entity : null;
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
      return true;
    }
    return false;
  }

  collectNearby() {
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

  update() {
    if (!this.autoPickup) return;
    this.collectNearby();
  }
}

export default ItemCollector;
