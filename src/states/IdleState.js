import { WanderState } from './WanderState.js';

export class IdleState {
  constructor(duration = null) {
    this.timer = 0;
    this.duration = duration;
  }

  enter(entity) {
    this.timer = 0;
    if (this.duration === null) {
      this.duration = 1 + Math.random() * 3;
    }
    const movement = entity.getComponent('movement');
    if (movement) movement.stop();
  }

  update(entity) {
    const game = entity.game;
    this.timer += game.deltaTime;
    if (this.timer >= this.duration) {
      const behavior = entity.getComponent('behavior');
      behavior.changeState(new WanderState());
    }
  }
}
