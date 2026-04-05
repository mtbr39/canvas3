export class AttackHitbox {
  constructor(damage, ownerEntity, duration = 0.2) {
    this.entity = null;
    this.damage = damage;
    this.ownerEntity = ownerEntity;
    this.duration = duration;
    this.timer = duration;
    this.hitEntities = new Set();
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
        return target !== this.ownerEntity && !this.hitEntities.has(target);
      }
    );

    for (const target of colliding) {
      const health = target.getComponent('health');
      if (!health || health.isDead) continue;

      health.takeDamage(this.damage, this.ownerEntity);
      this.hitEntities.add(target);
    }
  }
}
