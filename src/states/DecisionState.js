import { IdleState } from './IdleState.js';
import { WanderState } from './WanderState.js';

export class DecisionState {
  enter(entity) {
    // DecisionStateに入ったらすぐに次の状態を決定
    this.decideNextState(entity);
  }

  update(entity) {
    // 決定はenterで行うので、updateでは何もしない
  }

  decideNextState(entity) {
    const behavior = entity.getComponent('behavior');
    if (!behavior) return;

    // ランダムに次の状態を選択
    const rand = Math.random();

    if (rand < 0.5) {
      // 50%の確率でIdleState
      behavior.changeState(new IdleState());
    } else {
      // 50%の確率でWanderState
      behavior.changeState(new WanderState());
    }
  }
}
