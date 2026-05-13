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
    this.lastAttacker = null;
  }

  update() {
    const dt = this.entity.game.deltaTime;

    // 攻撃者が死んだら忘れる。戦闘の継続/離脱判定はCombatStateの距離で行うのでタイマーは持たない。
    if (this.lastAttacker && this.lastAttacker.getComponent('health')?.isDead) {
      this.lastAttacker = null;
    }

    if (this.isDead || this.regenRate <= 0) return;
    if (this.currentHealth >= this.maxHealth) {
      this._regenAccumulator = 0;
      return;
    }
    this._regenAccumulator += this.regenRate * dt;
    if (this._regenAccumulator >= 1) {
      const gain = Math.floor(this._regenAccumulator);
      this._regenAccumulator -= gain;
      this.currentHealth = Math.min(this.currentHealth + gain, this.maxHealth);
    }
  }

  takeDamage(amount, attacker = null) {
    if (this.isDead) return;
    this.currentHealth -= amount;
    if (attacker && attacker !== this.entity) {
      this.lastAttacker = attacker;
    }

    if (this.entity && !this.isDead) {
      const renderer = this.entity.getComponent('shapeRenderer') || this.entity.getComponent('appearance');
      if (renderer && renderer.flash) {
        renderer.flash();
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
