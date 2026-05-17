export class AttackHitbox {
  constructor(damage, ownerEntity, duration = 0.2, hitFilter = null) {
    this.entity = null;
    this.damage = damage;
    this.ownerEntity = ownerEntity;
    this.duration = duration;
    this.timer = duration;
    this.hitEntities = new Set();
    this.hitFilter = hitFilter;
  }

  update() {
    const game = this.entity.game;
    this.timer -= game.deltaTime;

    if (this.timer <= 0) {
      game.markEntityForRemoval(this.entity);
      return;
    }

    this.checkCollisions();
  }

  checkCollisions() {
    const game = this.entity.game;

    const colliding = game.spatialQuery.findCollidingEntities(
      this.entity,
      (target) => {
        if (target === this.ownerEntity) return false;
        if (this.hitEntities.has(target)) return false;
        if (this.hitFilter && !this.hitFilter(target)) return false;
        return true;
      }
    );

    let hitOccurred = false;
    for (const target of colliding) {
      const health = target.getComponent('health');
      if (!health || health.isDead) continue;

      health.takeDamage(this.damage, this.ownerEntity);
      this.hitEntities.add(target);
      hitOccurred = true;
    }

    if (hitOccurred) {
      const projectile = this.entity.getComponent('projectile');
      if (projectile && !projectile.pierce) {
        game.markEntityForRemoval(this.entity);
      }
    }
  }
}
