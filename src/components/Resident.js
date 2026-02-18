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
}
