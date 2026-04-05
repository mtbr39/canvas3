import { DecisionState } from './DecisionState.js';

const REVIVE_DURATION = 3.0;   // 蘇生にかかる秒数
const REVIVE_HP_RATIO = 0.3;   // 蘇生時に回復するHPの割合
const REVIVE_RANGE = 100;       // 蘇生を開始する距離

export class ReviveState {
  constructor(target) {
    this.target = target;
    this.timer = 0;
    this.reviving = false;
  }

  enter(entity) {
    entity.getComponent('party')?.detach();
    this._moveToTarget(entity);
  }

  update(entity) {
    const health = this.target?.getComponent('health');
    if (!health?.isDead) {
      this._finish(entity);
      return;
    }

    const dist = entity.game.spatialQuery.getDistance(entity, this.target);
    if (!this.reviving) {
      if (dist <= REVIVE_RANGE) {
        this.reviving = true;
        entity.getComponent('movement')?.stop();
      } else {
        this._moveToTarget(entity);
      }
      return;
    }

    this.timer += entity.game.deltaTime;
    if (this.timer >= REVIVE_DURATION) {
      health.revive(REVIVE_HP_RATIO);
      const targetBehavior = this.target.getComponent('behavior');
      if (targetBehavior) targetBehavior.changeState(new DecisionState());
      this._finish(entity);
    }
  }

  _moveToTarget(entity) {
    const t = this.target.getComponent('transform');
    entity.getComponent('movement')?.moveTo(t.x, t.y);
  }

  _finish(entity) {
    entity.getComponent('party')?.reattach();
    entity.getComponent('behavior').changeState(new DecisionState());
  }
}
