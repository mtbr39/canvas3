export class Party {
  constructor() {
    this.entity = null;
    this.partyId = null;
  }

  get _manager() {
    return this.entity.game.registry.get('partyManager');
  }

  update() {
    const target = this.getFormationTarget();
    if (!target) return;
    const movement = this.entity.getComponent('movement');
    if (movement) movement.moveTo(target.x, target.y);
  }

  isInParty() {
    return this.partyId !== null;
  }

  getMembers() {
    if (!this.isInParty()) return [];
    return this._manager.getMembers(this.partyId);
  }

  isAlly(otherEntity) {
    if (!this.isInParty()) return false;
    return this._manager.isInSameParty(this.entity, otherEntity);
  }

  // 目的地を設定する（全員で向かう）
  setDestination(x, y) {
    if (!this.isInParty()) return;
    this._manager.setDestination(this.partyId, x, y);
  }

  clearDestination() {
    if (!this.isInParty()) return;
    this._manager.clearDestination(this.partyId);
  }

  // このメンバーが今向かうべき座標 (formationCenter)
  getFormationTarget() {
    if (!this.isInParty()) return null;
    return this._manager.getFormationCenter(this.partyId);
  }

  hasDestination() {
    if (!this.isInParty()) return false;
    return this._manager.hasDestination(this.partyId);
  }

  // 自分を含む新パーティを結成する
  form(memberEntities) {
    this.leave();
    const id = this._manager.createParty(this.entity);
    this.partyId = id;
    for (const member of memberEntities) {
      const partyComp = member.getComponent('party');
      if (partyComp && member !== this.entity) {
        partyComp.join(id);
      }
    }
    return id;
  }

  join(partyId) {
    if (this._manager.joinParty(partyId, this.entity)) {
      this.partyId = partyId;
      return true;
    }
    return false;
  }

  leave() {
    if (!this.isInParty()) return;
    this._manager.leaveParty(this.entity);
    this.partyId = null;
  }
}
