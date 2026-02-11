export class Combat {
  constructor(role = 'villager', damage = 10, attackRange = 250, cooldown = 1.0) {
    this.entity = null;
    this.role = role; // 'adventurer' or 'villager'
    this.damage = damage;
    this.attackRange = attackRange;
    this.cooldown = cooldown;
    this.cooldownTimer = 0;
  }

  isAdventurer() {
    return this.role === 'adventurer';
  }

  canAttack() {
    return this.cooldownTimer <= 0;
  }

  attack(targetEntity) {
    if (!this.canAttack()) return false;
    const targetHealth = targetEntity.getComponent('health');
    if (!targetHealth || targetHealth.isDead) return false;
    targetHealth.takeDamage(this.damage);
    this.cooldownTimer = this.cooldown;
    return true;
  }

  update() {
    const game = this.entity.game;
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= game.deltaTime;
    }
  }
}
