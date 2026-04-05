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

    // Target fled too far - give up
    if (game.spatialQuery.getDistance(entity, target) > combat.chaseRange) {
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
      const fleeDestination = this.getFleeDestination(entity, targetTransform);
      movement.moveTo(fleeDestination.x, fleeDestination.y);
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

  getFleeDestination(entity, targetTransform) {
    const FLEE_DISTANCE = 200;
    const ALLY_PROXIMITY_THRESHOLD = 1000;
    const transform = entity.getComponent('transform');

    const nearestAlly = this.findNearestAlly(entity);
    if (nearestAlly) {
      const allyTransform = nearestAlly.getComponent('transform');
      const dx = transform.x - allyTransform.x;
      const dy = transform.y - allyTransform.y;
      const distToAlly = Math.sqrt(dx * dx + dy * dy);
      if (distToAlly > ALLY_PROXIMITY_THRESHOLD) {
        return { x: allyTransform.x, y: allyTransform.y };
      }
    }

    const dx = transform.x - targetTransform.x;
    const dy = transform.y - targetTransform.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: transform.x, y: transform.y };
    return {
      x: transform.x + (dx / dist) * FLEE_DISTANCE,
      y: transform.y + (dy / dist) * FLEE_DISTANCE,
    };
  }

  findNearestAlly(entity) {
    const party = entity.getComponent('party');
    if (!party || !party.isInParty()) return null;

    const transform = entity.getComponent('transform');
    let nearest = null;
    let nearestDist = Infinity;

    for (const member of party.getMembers()) {
      if (member === entity) continue;
      const health = member.getComponent('health');
      if (!health || health.isDead) continue;
      const mt = member.getComponent('transform');
      if (!mt) continue;
      const dx = transform.x - mt.x;
      const dy = transform.y - mt.y;
      const d = dx * dx + dy * dy;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = member;
      }
    }
    return nearest;
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
