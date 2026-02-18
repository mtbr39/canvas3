import { DecisionState } from './DecisionState.js';

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
