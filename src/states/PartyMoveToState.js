import { DecisionState } from './DecisionState.js';
import { CollectItemState } from './CollectItemState.js';

export class PartyMoveToState {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  getLabel() { return 'PartyMove'; }

  enter(entity) {
    const party = entity.getComponent('party');
    if (party && party.isInParty()) {
      party.reattach();
      if (!party.hasDestination()) {
        party.setDestination(this.x, this.y);
      }
    } else {
      entity.getComponent('movement')?.moveTo(this.x, this.y);
    }
  }

  exit(entity) {
    entity.getComponent('party')?.detach();
  }

  update(entity) {
    const itemCollector = entity.getComponent('itemCollector');
    if (itemCollector && itemCollector.findNearbyItem()) {
      entity.getComponent('behavior').changeState(new CollectItemState());
      return;
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
