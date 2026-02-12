import { DecisionState } from './DecisionState.js';
import { ITEMS } from '../data/Items.js';

export class CollectItemState {
  constructor() {
    this.targetItem = null;
    this.searchRange = 200;
  }

  enter(entity) {
    const movement = entity.getComponent('movement');
    if (movement) movement.stop();

    this.targetItem = this.findNearestItem(entity);
    if (!this.targetItem) {
      const behavior = entity.getComponent('behavior');
      behavior.changeState(new DecisionState());
    }
  }

  update(entity) {
    if (!this.targetItem) {
      const behavior = entity.getComponent('behavior');
      behavior.changeState(new DecisionState());
      return;
    }

    const itemInfo = this.targetItem.getComponent('itemInfo');
    if (!itemInfo || !itemInfo.canPickup()) {
      const behavior = entity.getComponent('behavior');
      behavior.changeState(new DecisionState());
      return;
    }

    const itemCollector = entity.getComponent('itemCollector');
    if (!itemCollector) {
      const behavior = entity.getComponent('behavior');
      behavior.changeState(new DecisionState());
      return;
    }

    if (itemCollector.tryPickup(this.targetItem)) {
      const floatingText = entity.getComponent('floatingText');
      if (floatingText) {
        const itemData = ITEMS[itemInfo.itemType];
        if (itemData) {
          floatingText.show(itemData.name);
        }
      }

      const behavior = entity.getComponent('behavior');
      behavior.changeState(new DecisionState());
      return;
    }

    const transform = entity.getComponent('transform');
    const targetTransform = this.targetItem.getComponent('transform');
    if (!targetTransform) {
      const behavior = entity.getComponent('behavior');
      behavior.changeState(new DecisionState());
      return;
    }

    const dx = targetTransform.x - transform.x;
    const dy = targetTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= itemCollector.pickupRange) {
      return;
    }

    const movement = entity.getComponent('movement');
    if (movement) {
      movement.moveTo(targetTransform.x, targetTransform.y);
    }
  }

  findNearestItem(entity) {
    const transform = entity.getComponent('transform');
    const inventory = entity.getComponent('inventory');
    const spatialQuery = entity.game.spatialQuery;

    if (!transform || !inventory || !spatialQuery) return null;
    if (inventory.isFull()) return null;

    const nearbyResults = spatialQuery.findNearbyEntities(
      entity.game.entities,
      transform.x,
      transform.y,
      this.searchRange,
      (e) => {
        if (e === entity) return false;
        const itemInfo = e.getComponent('itemInfo');
        return itemInfo && itemInfo.canPickup();
      }
    );

    if (nearbyResults.length === 0) return null;
    return nearbyResults[0].entity;
  }
}
