const GATHER_RADIUS = 80;   // 全員がこの範囲内に入ったら中心点が前進する
const FORMATION_SPEED = 50; // 中心点の移動速度 (px/s)

export class PartyManager {
  constructor() {
    this.game = null;
    this.parties = new Map();       // partyId -> { members, destination, formationCenter }
    this.entityToParty = new Map(); // entity -> partyId
    this.nextId = 1;
  }

  update() {
    const dt = this.game.deltaTime;
    for (const party of this.parties.values()) {
      if (party.destination && party.formationCenter) {
        this._advanceFormationCenter(party, dt);
      }
    }
  }

  createParty(leaderEntity) {
    const partyId = this.nextId++;
    this.parties.set(partyId, {
      members: new Set([leaderEntity]),
      destination: null,
      formationCenter: null,
    });
    this.entityToParty.set(leaderEntity, partyId);
    return partyId;
  }

  joinParty(partyId, entity) {
    const party = this.parties.get(partyId);
    if (!party) return false;
    this._leave(entity);
    party.members.add(entity);
    this.entityToParty.set(entity, partyId);
    return true;
  }

  leaveParty(entity) {
    this._leave(entity);
  }

  disbandParty(partyId) {
    const party = this.parties.get(partyId);
    if (!party) return;
    for (const member of party.members) {
      this.entityToParty.delete(member);
    }
    this.parties.delete(partyId);
  }

  setDestination(partyId, x, y) {
    const party = this.parties.get(partyId);
    if (!party) return;
    party.destination = { x, y };
    party.formationCenter = { ...this._getCentroid(party) };
  }

  clearDestination(partyId) {
    const party = this.parties.get(partyId);
    if (!party) return;
    party.destination = null;
    party.formationCenter = null;
  }

  getFormationCenter(partyId) {
    return this.parties.get(partyId)?.formationCenter ?? null;
  }

  hasDestination(partyId) {
    return this.parties.get(partyId)?.destination != null;
  }

  getDestination(partyId) {
    return this.parties.get(partyId)?.destination ?? null;
  }

  getPartyId(entity) {
    return this.entityToParty.get(entity) ?? null;
  }

  getMembers(partyId) {
    const party = this.parties.get(partyId);
    return party ? [...party.members] : [];
  }

  isInSameParty(entityA, entityB) {
    const id = this.entityToParty.get(entityA);
    return id != null && id === this.entityToParty.get(entityB);
  }

  _advanceFormationCenter(party, dt) {
    const fc = party.formationCenter;

    // 全員が formationCenter の GATHER_RADIUS 内に入るまで待つ
    const allGathered = [...party.members].every(member => {
      const t = member.getComponent('transform');
      if (!t) return true;
      const dx = t.x - fc.x;
      const dy = t.y - fc.y;
      return dx * dx + dy * dy <= GATHER_RADIUS * GATHER_RADIUS;
    });
    if (!allGathered) return;

    // 中心点を目的地へ前進
    const dest = party.destination;
    const dx = dest.x - fc.x;
    const dy = dest.y - fc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = FORMATION_SPEED * dt;

    if (dist <= step) {
      party.destination = null;
      party.formationCenter = null;
      return;
    }

    fc.x += (dx / dist) * step;
    fc.y += (dy / dist) * step;
  }

  _getCentroid(party) {
    let x = 0, y = 0, count = 0;
    for (const member of party.members) {
      const t = member.getComponent('transform');
      if (t) { x += t.x; y += t.y; count++; }
    }
    return count > 0 ? { x: x / count, y: y / count } : { x: 0, y: 0 };
  }

  _leave(entity) {
    const partyId = this.entityToParty.get(entity);
    if (partyId == null) return;
    const party = this.parties.get(partyId);
    if (!party) return;

    party.members.delete(entity);
    this.entityToParty.delete(entity);

    if (party.members.size === 0) {
      this.parties.delete(partyId);
    }
  }
}
