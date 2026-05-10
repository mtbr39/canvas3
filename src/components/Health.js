import { DeadState } from '../states/DeadState.js';

export class Health {
  constructor(maxHealth = 100, { regenRate = 0 } = {}) {
    this.entity = null;
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.isDead = false;
    this.removeOnDeath = true;
    this.regenRate = regenRate;
    this._regenAccumulator = 0;
  }

  update() {
    if (this.isDead || this.regenRate <= 0) return;
    if (this.currentHealth >= this.maxHealth) {
      this._regenAccumulator = 0;
      return;
    }
    this._regenAccumulator += this.regenRate * this.entity.game.deltaTime;
    if (this._regenAccumulator >= 1) {
      const gain = Math.floor(this._regenAccumulator);
      this._regenAccumulator -= gain;
      this.currentHealth = Math.min(this.currentHealth + gain, this.maxHealth);
    }
  }

  takeDamage(amount, attacker = null) {
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
      this.onDeath(attacker);
    }
  }

  heal(amount) {
    if (this.isDead) return;
    this.currentHealth = Math.min(this.currentHealth + amount, this.maxHealth);
  }

  revive(ratio = 1.0) {
    this.isDead = false;
    this.currentHealth = Math.max(1, Math.floor(this.maxHealth * ratio));
  }

  onDeath(attacker = null) {
    if (!this.entity || !this.entity.game) return;

    const loot = this.entity.getComponent('loot');
    if (loot) loot.drop(attacker);

    if (this.removeOnDeath) {
      this.entity.game.markEntityForRemoval(this.entity);
    } else {
      const behavior = this.entity.getComponent('behavior');
      if (behavior) behavior.changeState(new DeadState());
    }
  }
}
