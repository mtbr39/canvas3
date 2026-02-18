export class Resident {
  constructor() {
    this.home = null; // Building entity
  }

  moveTo(buildingEntity) {
    if (this.home) {
      const inn = this.home.getComponent('inn');
      if (inn) inn.evict(this.entity);
    }

    this.home = buildingEntity;

    if (buildingEntity) {
      const inn = buildingEntity.getComponent('inn');
      if (inn) inn.admit(this.entity);
    }
  }

  leave() {
    this.moveTo(null);
  }

  isInLocation(tag) {
    const game = this.entity.game;
    return game.spatialQuery.findCollidingEntities(this.entity, (e) => {
      const t = e.getComponent('tag');
      return t && t.hasTag(tag);
    }).length > 0;
  }

  checkIn() {
    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    const nearbyInns = game.spatialQuery.findNearbyEntities(
      game.entities, transform.x, transform.y, 2000,
      (e) => {
        const tag = e.getComponent('tag');
        const inn = e.getComponent('inn');
        return tag && tag.hasTag('inn') && inn && !inn.isFull();
      }
    );

    if (nearbyInns.length > 0) {
      this.moveTo(nearbyInns[0].entity);
      return true;
    }
    return false;
  }
}
