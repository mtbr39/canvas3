import { DecisionState } from './DecisionState.js';

export class SoloMoveToState {
  constructor(x, y, nextState = null) {
    this.x = x;
    this.y = y;
    this.nextState = nextState;
  }

  enter(entity) {
    entity.getComponent('party')?.detach();
    entity.getComponent('movement')?.moveTo(this.x, this.y);
  }

  update(entity) {
    const movement = entity.getComponent('movement');
    if (movement?.hasArrived()) {
      entity.getComponent('party')?.reattach();
      entity.getComponent('behavior').changeState(this.nextState ?? new DecisionState());
    }
  }
}
