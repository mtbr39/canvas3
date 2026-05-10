import { DecisionState } from './DecisionState.js';

const DODGE_DISTANCE = 80;
const DODGE_DURATION = 0.2;

export class DodgeState {
  constructor(returnState, dirX, dirY) {
    this.returnState = returnState;
    this.dirX = dirX;
    this.dirY = dirY;
    this.timer = 0;
    this.startX = 0;
    this.startY = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  enter(entity) {
    const transform = entity.getComponent('transform');
    if (!transform) return;
    this.startX = transform.x;
    this.startY = transform.y;
    this.targetX = transform.x + this.dirX * DODGE_DISTANCE;
    this.targetY = transform.y + this.dirY * DODGE_DISTANCE;
    transform.direction = Math.atan2(this.dirY, this.dirX);
    entity.getComponent('movement')?.stop();

    const floatingText = entity.getComponent('floatingText');
    if (floatingText) floatingText.show('回避');
  }

  update(entity) {
    const game = entity.game;
    const transform = entity.getComponent('transform');
    const behavior = entity.getComponent('behavior');
    if (!transform || !behavior) return;

    this.timer += game.deltaTime;
    const t = Math.min(this.timer / DODGE_DURATION, 1);

    transform.x = this.startX + (this.targetX - this.startX) * t;
    transform.y = this.startY + (this.targetY - this.startY) * t;

    if (this.timer >= DODGE_DURATION) {
      behavior.changeState(this.returnState ?? new DecisionState());
    }
  }

  exit(entity) {
    entity.getComponent('movement')?.stop();
  }
}
