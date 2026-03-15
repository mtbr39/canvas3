import { DecisionState } from './DecisionState.js';
import { ITEMS } from '../data/Items.js';

export class CollectItemState {
  constructor() {
    this.targetItem = null;
  }

  enter(entity) {
    entity.getComponent('movement')?.stop();

    this.targetItem = entity.getComponent('itemCollector')?.findNearbyItem() ?? null;
    if (!this.targetItem) {
      entity.getComponent('behavior').changeState(new DecisionState());
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

}
