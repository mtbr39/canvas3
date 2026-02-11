import { IdleState } from './IdleState.js';
import { WanderState } from './WanderState.js';
import { CombatState } from './CombatState.js';

export function createCombatInterruptCheck() {
  return (entity, currentState) => {
    // CombatState中は割り込まない
    if (currentState?.constructor.name === 'CombatState') return null;

    const combat = entity.getComponent('combat');
    if (combat) {
      const enemy = combat.findNearbyEnemy();
      if (enemy) {
        return new CombatState();
      }
    }
    return null;
  };
}

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

    const combat = entity.getComponent('combat');

    // Check if this entity seeks combat
    if (combat && combat.shouldSeekCombat) {
      const transform = entity.getComponent('transform');
      if (transform) {
        const game = entity.game;
        const tag = entity.getComponent('tag');
        const enemyTag = tag?.tag === 'human' ? 'monster' : 'human';

        const nearbyEnemies = game.spatialQuery.findNearbyByTag(
          game.entities, transform.x, transform.y, combat.getAttackRange(), enemyTag
        );

        // Check if any nearby enemies are alive
        for (const result of nearbyEnemies) {
          const health = result.entity.getComponent('health');
          if (health && !health.isDead) {
            behavior.changeState(new CombatState());
            return;
          }
        }
      }
    }

    // Default: Idle or Wander
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
