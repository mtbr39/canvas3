export class Health {
  constructor(maxHealth = 100) {
    this.entity = null;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.isDead = false;
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.currentHealth -= amount;

    if (this.entity && !this.isDead) {
      const circleRenderer = this.entity.getComponent('circleRenderer');
      if (circleRenderer) {
        circleRenderer.flash();
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
    if (this.entity && this.entity.game) {
      this.entity.game.markEntityForRemoval(this.entity);
    }
  }
}
