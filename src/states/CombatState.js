import { DecisionState } from './DecisionState.js';

export class CombatState {
  constructor() {
    this.target = null;
    this.checkInterval = 0.5;
    this.checkTimer = 0;
  }

  enter(entity) {
    this.checkTimer = 0;
    this.findTarget(entity);
  }

  findTarget(entity) {
    const transform = entity.getComponent('transform');
    const combat = entity.getComponent('combat');
    if (!transform || !combat) return;

    const game = entity.game;
    const nearbyMonsters = game.findNearbyByTag(
      transform.x, transform.y, combat.attackRange, 'monster'
    );

    // Find first alive monster
    for (const result of nearbyMonsters) {
      const health = result.entity.getComponent('health');
      if (health && !health.isDead) {
        this.target = result.entity;
        return;
      }
    }
    this.target = null;
  }

  update(entity) {
    const game = entity.game;
    const combat = entity.getComponent('combat');
    const transform = entity.getComponent('transform');
    const movement = entity.getComponent('movement');
    const behavior = entity.getComponent('behavior');

    if (!combat || !transform || !movement || !behavior) return;

    // Periodically recheck for targets
    this.checkTimer += game.deltaTime;
    if (this.checkTimer >= this.checkInterval) {
      this.checkTimer = 0;
      this.findTarget(entity);
    }

    // No target - return to decision
    if (!this.target) {
      behavior.changeState(new DecisionState());
      return;
    }

    // Check if target is still alive
    const targetHealth = this.target.getComponent('health');
    if (!targetHealth || targetHealth.isDead) {
      this.target = null;
      return;
    }

    // Get target position
    const targetTransform = this.target.getComponent('transform');
    if (!targetTransform) {
      this.target = null;
      return;
    }

    // Calculate distance
    const dx = targetTransform.x - transform.x;
    const dy = targetTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Out of range - return to decision
    if (distance > combat.attackRange) {
      behavior.changeState(new DecisionState());
      return;
    }

    // Move to attack range
    const closeRange = 50;
    if (distance > closeRange) {
      movement.moveTo(targetTransform.x, targetTransform.y);
    } else {
      movement.stop();
      if (combat.canAttack()) {
        combat.attack(this.target);
      }
    }
  }

  exit(entity) {
    const movement = entity.getComponent('movement');
    if (movement) movement.stop();
    this.target = null;
  }
}
