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
    const tag = entity.getComponent('tag');
  }

  findTarget(entity) {
    const transform = entity.getComponent('transform');
    const combat = entity.getComponent('combat');
    if (!transform || !combat) return;

    const game = entity.game;
    const tag = entity.getComponent('tag');
    const enemyTag = tag?.tag === 'human' ? 'monster' : 'human';

    const nearbyEnemies = game.spatialQuery.findNearbyByTag(
      game.entities, transform.x, transform.y, combat.getAttackRange(), enemyTag
    );

    // Find first alive enemy
    for (const result of nearbyEnemies) {
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

    // Calculate center-to-center distance
    const centerDistance = game.spatialQuery.getDistance(entity, this.target);
    const weaponRange = combat.getWeaponRange();

    // Within weapon range - try to attack
    if (centerDistance <= weaponRange) {
      movement.stop();
      if (combat.canAttack()) {
        combat.attack(this.target);
      } else {

      }
    } else {
      // Move closer to get within weapon range
      movement.moveTo(targetTransform.x, targetTransform.y);
    }
  }

  exit(entity) {
    const movement = entity.getComponent('movement');
    if (movement) movement.stop();
    this.target = null;
  }
}
