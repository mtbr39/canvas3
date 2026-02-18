import { DecisionState } from './DecisionState.js';

export class SoloMoveToState {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  enter(entity) {
    entity.getComponent('party')?.detach();
    entity.getComponent('movement')?.moveTo(this.x, this.y);
  }

  update(entity) {
    const movement = entity.getComponent('movement');
    if (movement?.hasArrived()) {
      entity.getComponent('party')?.reattach();
      entity.getComponent('behavior').changeState(new DecisionState());
    }
  }
}
