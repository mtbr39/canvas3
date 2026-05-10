import { createAttackHitbox } from '../entities/AttackHitbox.js';

const FLEE_SPEED_MULTIPLIER = 3;
const REACTION_TIME = 0.25;
const DODGE_COOLDOWN = 1.0;
const LOW_HP_THRESHOLD = 0.35;
const KITE_RANGE_RANGED = 0.5;
const KITE_RANGE_LOW_HP_MELEE = 1.2;

export class Combat {
  constructor(shouldSeekCombat = false, detectionRange, chaseRange) {
    this.entity = null;
    this.shouldSeekCombat = shouldSeekCombat;
    this.cooldownTimer = 0;
    this.fleeSpeedMultiplier = FLEE_SPEED_MULTIPLIER;
    this.fleeStopMultiplier = 3.0;
    this.detectionRange = detectionRange;
    this.chaseRange = chaseRange ?? detectionRange * 1.5;
    this.joinAllyRange = this.chaseRange * 1.5;
    this.windup = null;
    this.reactionTime = REACTION_TIME;
    this.dodgeCooldown = 0;
    this.perceiving = null;
  }

  static createAggressive(detectionRange, chaseRange) {
    return new Combat(true, detectionRange, chaseRange);
  }

  static createDefensive(detectionRange, chaseRange) {
    return new Combat(false, detectionRange, chaseRange);
  }

  getAttackRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 100;

    const weapon = equipment.getWeapon();
    return weapon.attackType === 'ranged' ? 250 : 150;
  }

  getWeaponRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 50;

    const weapon = equipment.getWeapon();
    if (weapon.attackType === 'melee') {
      return weapon.hitbox.distance + weapon.hitbox.radius;
    } else {
      return weapon.projectile.speed * weapon.projectile.duration;
    }
  }

  // 接近されたときに離れたい内側の距離。0なら離れない
  getKiteRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 0;
    const weapon = equipment.getWeapon();
    const baseRange = this.getWeaponRange();

    if (weapon.attackType === 'ranged') {
      return baseRange * KITE_RANGE_RANGED;
    }

    const health = this.entity.getComponent('health');
    if (health && health.maxHealth > 0 && health.currentHealth / health.maxHealth < LOW_HP_THRESHOLD) {
      return baseRange * KITE_RANGE_LOW_HP_MELEE;
    }
    return 0;
  }

  canAttack() {
    return this.cooldownTimer <= 0 && !this.windup;
  }

  findNearbyEnemy() {
    const transform = this.entity.getComponent('transform');
    if (!transform) return null;

    const game = this.entity.game;
    const tag = this.entity.getComponent('tag');
    const enemyTag = tag?.hasTag('human') ? 'monster' : 'human';

    const nearbyEnemies = game.spatialQuery.findNearbyByTag(
      game.entities, transform.x, transform.y, this.detectionRange, enemyTag
    );

    for (const result of nearbyEnemies) {
      const health = result.entity.getComponent('health');
      if (health && !health.isDead) {
        return result.entity;
      }
    }

    return null;
  }

  attack(targetEntity) {
    if (!this.canAttack()) return false;

    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return false;

    const weapon = equipment.getWeapon();

    const transform = this.entity.getComponent('transform');
    const targetTransform = targetEntity.getComponent('transform');
    if (!transform || !targetTransform) return false;

    const dx = targetTransform.x - transform.x;
    const dy = targetTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return false;

    const dirX = dx / distance;
    const dirY = dy / distance;

    const windupDuration = weapon.windup ?? 0.2;

    this.windup = {
      weapon,
      target: targetEntity,
      dirX,
      dirY,
      timer: windupDuration,
      duration: windupDuration,
    };
    this.cooldownTimer = windupDuration + weapon.cooldown;

    const floatingText = this.entity.getComponent('floatingText');
    if (floatingText) {
      floatingText.show(weapon.name);
    }

    return true;
  }

  _executeWindupAttack() {
    const w = this.windup;
    if (!w) return;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    if (w.weapon.attackType === 'melee') {
      this.performMeleeAttack(transform, w.dirX, w.dirY, w.weapon);
    } else if (w.weapon.attackType === 'ranged') {
      this.performRangedAttack(transform, w.dirX, w.dirY, w.weapon);
    }
  }

  performMeleeAttack(transform, dirX, dirY, weapon) {
    const hitboxX = transform.x + dirX * weapon.hitbox.distance;
    const hitboxY = transform.y + dirY * weapon.hitbox.distance;

    const game = this.entity.game;
    const hitbox = createAttackHitbox(
      hitboxX,
      hitboxY,
      weapon.hitbox.radius,
      weapon.damage,
      this.entity,
      weapon.hitbox.duration
    );
    game.addEntity(hitbox);
  }

  performRangedAttack(transform, dirX, dirY, weapon) {
    const spawnDistance = 30;
    const startX = transform.x + dirX * spawnDistance;
    const startY = transform.y + dirY * spawnDistance;

    const game = this.entity.game;
    const hitbox = createAttackHitbox(
      startX,
      startY,
      weapon.projectile.radius,
      weapon.damage,
      this.entity,
      weapon.projectile.duration,
      {
        dirX: dirX,
        dirY: dirY,
        speed: weapon.projectile.speed
      }
    );
    game.addEntity(hitbox);
  }

  // 自分を狙っている、windup中の敵
  findIncomingAttack() {
    const transform = this.entity.getComponent('transform');
    if (!transform) return null;

    const game = this.entity.game;
    const tag = this.entity.getComponent('tag');
    const enemyTag = tag?.hasTag('human') ? 'monster' : 'human';

    const nearby = game.spatialQuery.findNearbyByTag(
      game.entities, transform.x, transform.y, this.detectionRange, enemyTag
    );

    for (const result of nearby) {
      const enemyCombat = result.entity.getComponent('combat');
      if (!enemyCombat?.windup) continue;
      if (enemyCombat.windup.target === this.entity) {
        return result.entity;
      }
    }
    return null;
  }

  // 回避すべきならその発生源を返す。完了後にリセットされる
  consumeDodgePlan() {
    if (!this.perceiving) return null;
    if (this.perceiving.timer > 0) return null;
    if (this.dodgeCooldown > 0) return null;
    const from = this.perceiving.from;
    this.perceiving = null;
    this.dodgeCooldown = DODGE_COOLDOWN;
    return from;
  }

  update() {
    const game = this.entity.game;
    const dt = game.deltaTime;

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown -= dt;
    }

    if (this.windup) {
      this.windup.timer -= dt;
      if (this.windup.timer <= 0) {
        this._executeWindupAttack();
        this.windup = null;
      }
    }

    // 脅威の知覚: 検出してから reactionTime 経つと回避発動
    const threat = this.findIncomingAttack();
    if (threat) {
      if (!this.perceiving || this.perceiving.from !== threat) {
        this.perceiving = { from: threat, timer: this.reactionTime };
      } else {
        this.perceiving.timer -= dt;
      }
    } else {
      this.perceiving = null;
    }
  }
}
