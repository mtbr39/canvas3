import { DecisionState } from './DecisionState.js';

export class WanderState {
  enter(entity) {
    const movement = entity.getComponent('movement');
    if (!movement) return;

    const x = Math.random() * 1920;
    const y = Math.random() * 1080;
    movement.moveTo(x, y);
  }

  update(entity) {
    const movement = entity.getComponent('movement');
    if (!movement) return;

    if (movement.hasArrived()) {
      const behavior = entity.getComponent('behavior');
      behavior.changeState(new DecisionState());
    }
  }
}
