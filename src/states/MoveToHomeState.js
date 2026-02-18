import { DecisionState } from './DecisionState.js';
import { HomeState } from './HomeState.js';

export class MoveToHomeState {
  enter(entity) {
    const home = entity.getComponent('resident')?.home;
    if (!home) {
      entity.getComponent('behavior').changeState(new DecisionState());
      return;
    }
    const t = home.getComponent('transform');
    entity.getComponent('movement')?.moveTo(t.x, t.y);
  }

  update(entity) {
    const movement = entity.getComponent('movement');
    if (movement?.hasArrived()) {
      entity.getComponent('behavior').changeState(new HomeState());
    }
  }
}
