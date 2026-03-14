import { DecisionState } from './DecisionState.js';
import { CollectItemState } from './CollectItemState.js';

export class PartyMoveToState {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  enter(entity) {
    const party = entity.getComponent('party');
    if (party && party.isInParty()) {
      // パーティがまだ移動中でなければ目的地をセット
      if (!party.hasDestination()) {
        party.setDestination(this.x, this.y);
      }
    } else {
      entity.getComponent('movement')?.moveTo(this.x, this.y);
    }
  }

  update(entity) {
    const itemCollector = entity.getComponent('itemCollector');
    const inventory = entity.getComponent('inventory');
    if (itemCollector && inventory && !inventory.isFull()) {
      const transform = entity.getComponent('transform');
      const nearbyResults = entity.game.spatialQuery.findNearbyEntities(
        entity.game.entities,
        transform.x, transform.y,
        200,
        (e) => {
          if (e === entity) return false;
          const itemInfo = e.getComponent('itemInfo');
          return itemInfo && itemInfo.canPickup();
        }
      );
      if (nearbyResults.length > 0) {
        entity.getComponent('behavior').changeState(new CollectItemState());
        return;
      }
    }

    const party = entity.getComponent('party');
    if (party && party.isInParty()) {
      if (!party.hasDestination()) {
        entity.getComponent('behavior').changeState(new DecisionState());
      }
    } else {
      const movement = entity.getComponent('movement');
      if (movement?.hasArrived()) {
        entity.getComponent('behavior').changeState(new DecisionState());
      }
    }
  }
}
