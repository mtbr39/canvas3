import { createAttackHitbox } from '../entities/AttackHitbox.js';

export class Combat {
  constructor(shouldSeekCombat = false) {
    this.entity = null;
    this.shouldSeekCombat = shouldSeekCombat;
    this.cooldownTimer = 0;
  }

  static createAggressive() {
    return new Combat(true);
  }

  static createDefensive() {
    return new Combat(false);
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

  canAttack() {
    return this.cooldownTimer <= 0;
  }

  findNearbyEnemy() {
    if (!this.shouldSeekCombat) return null;

    const transform = this.entity.getComponent('transform');
    if (!transform) return null;

    const game = this.entity.game;
    const tag = this.entity.getComponent('tag');
    const enemyTag = tag?.hasTag('human') ? 'monster' : 'human';

    const nearbyEnemies = game.spatialQuery.findNearbyByTag(
      game.entities, transform.x, transform.y, this.getAttackRange(), enemyTag
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

    if (weapon.attackType === 'melee') {
      this.performMeleeAttack(transform, dirX, dirY, weapon);
    } else if (weapon.attackType === 'ranged') {
      this.performRangedAttack(transform, dirX, dirY, weapon);
    }

    this.cooldownTimer = weapon.cooldown;

    const floatingText = this.entity.getComponent('floatingText');
    if (floatingText) {
      floatingText.show(weapon.name);
    }

    return true;
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

  update() {
    const game = this.entity.game;
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= game.deltaTime;
    }
  }
}
