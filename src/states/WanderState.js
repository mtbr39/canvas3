import { DecisionState } from './DecisionState.js';

export class WanderState {
  enter(entity) {
    const movement = entity.getComponent('movement');
    if (!movement) return;

    const transform = entity.getComponent('transform');
    const x = transform.x + (Math.random() - 0.5) * 1000;
    const y = transform.y + (Math.random() - 0.5) * 1000;
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
