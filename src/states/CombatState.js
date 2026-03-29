import { DecisionState } from './DecisionState.js';

export class CombatState {
  constructor(returnState = null) {
    this.returnState = returnState;
    this.target = null;
    this.checkInterval = 0.5;
    this.checkTimer = 0;
  }

  enter(entity) {
    this.checkTimer = 0;
    if (!this.target) this.findTarget(entity);
    entity.getComponent('party')?.clearDestination();
    const movement = entity.getComponent('movement');
    const combat = entity.getComponent('combat');
    if (movement && combat && !combat.shouldSeekCombat) {
      this.originalSpeed = movement.speed;
      movement.speed = movement.speed * combat.fleeSpeedMultiplier;
    }
    movement?.stop();
  }

  getTarget() {
    if (!this.target) return null;
    const health = this.target.getComponent('health');
    if (!health || health.isDead) return null;
    return this.target;
  }

  findTarget(entity) {
    const combat = entity.getComponent('combat');
    this.target = combat ? combat.findNearbyEnemy() : null;
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

    // No valid target - return to decision
    const target = this.getTarget();
    if (!target) {
      behavior.changeState(this.returnState ?? new DecisionState());
      return;
    }

    const targetTransform = target.getComponent('transform');
    if (!targetTransform) {
      behavior.changeState(this.returnState ?? new DecisionState());
      return;
    }

    // Calculate center-to-center distance
    const centerDistance = game.spatialQuery.getDistance(entity, target);

    if (!combat.shouldSeekCombat) {
      // Flee: move away from the enemy
      const transform = entity.getComponent('transform');
      const dx = transform.x - targetTransform.x;
      const dy = transform.y - targetTransform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        movement.moveTo(transform.x + (dx / dist) * 200, transform.y + (dy / dist) * 200);
      }
      return;
    }

    const weaponRange = combat.getWeaponRange();

    // Within weapon range - try to attack
    if (centerDistance <= weaponRange) {
      movement.stop();
      if (combat.canAttack()) {
        combat.attack(target);
      }
    } else {
      // Move closer to get within weapon range
      movement.moveTo(targetTransform.x, targetTransform.y);
    }
  }

  exit(entity) {
    const movement = entity.getComponent('movement');
    if (movement) {
      movement.stop();
      if (this.originalSpeed !== undefined) {
        movement.speed = this.originalSpeed;
        this.originalSpeed = undefined;
      }
    }
    this.target = null;
  }
}
