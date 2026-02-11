import { createAttackHitbox } from '../entities/AttackHitbox.js';

export class Combat {
  constructor(role = 'villager', damage = 10, attackRange = 250, cooldown = 1.0) {
    this.entity = null;
    this.role = role;
    this.damage = damage;
    this.attackRange = attackRange;
    this.cooldown = cooldown;
    this.cooldownTimer = 0;
    this.hitboxRadius = 30;
    this.hitboxDistance = 40;
    this.hitboxDuration = 0.2;
  }

  isAdventurer() {
    return this.role === 'adventurer';
  }

  canAttack() {
    return this.cooldownTimer <= 0;
  }

  attack(targetEntity) {
    if (!this.canAttack()) return false;

    const transform = this.entity.getComponent('transform');
    const targetTransform = targetEntity.getComponent('transform');
    if (!transform || !targetTransform) return false;

    const dx = targetTransform.x - transform.x;
    const dy = targetTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return false;

    const dirX = dx / distance;
    const dirY = dy / distance;

    const hitboxX = transform.x + dirX * this.hitboxDistance;
    const hitboxY = transform.y + dirY * this.hitboxDistance;

    const game = this.entity.game;
    const hitbox = createAttackHitbox(
      hitboxX,
      hitboxY,
      this.hitboxRadius,
      this.damage,
      this.entity,
      this.hitboxDuration
    );
    game.addEntity(hitbox);

    this.cooldownTimer = this.cooldown;

    const floatingText = this.entity.getComponent('floatingText');
    if (floatingText) {
      floatingText.show('攻撃');
    }

    return true;
  }

  update() {
    const game = this.entity.game;
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= game.deltaTime;
    }
  }
}
