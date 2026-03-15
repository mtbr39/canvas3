export class Health {
  constructor(maxHealth = 100) {
    this.entity = null;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.isDead = false;
    this.removeOnDeath = true;
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.currentHealth -= amount;

    if (this.entity && !this.isDead) {
      const shapeRenderer = this.entity.getComponent('shapeRenderer');
      if (shapeRenderer) {
        shapeRenderer.flash();
      }
    }

    if (this.currentHealth <= 0) {
      this.currentHealth = 0;
      this.isDead = true;
      this.onDeath();
    }
  }

  heal(amount) {
    if (this.isDead) return;
    this.currentHealth = Math.min(this.currentHealth + amount, this.maxHealth);
  }

  onDeath() {
    if (!this.entity || !this.entity.game) return;

    const loot = this.entity.getComponent('loot');
    if (loot) loot.drop();

    if (this.removeOnDeath) {
      this.entity.game.markEntityForRemoval(this.entity);
    } else {
      const behavior = this.entity.getComponent('behavior');
      if (behavior) behavior.disable();
    }
  }
}
