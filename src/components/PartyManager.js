const GATHER_RADIUS = 120;     // 全員が自分の目標位置に近づいたら中心点が前進する
const FORMATION_SPEED = 50;   // 中心点の移動速度 (px/s)
const FORMATION_RADIUS = 100;  // フォーメーション半径（メンバー間の間隔）

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

  getMemberTarget(entity) {
    const partyId = this.entityToParty.get(entity);
    if (partyId == null) return null;
    const party = this.parties.get(partyId);
    if (!party || !party.formationCenter) return null;
    const offset = this._getFormationOffset(party, entity);
    return {
      x: party.formationCenter.x + offset.x,
      y: party.formationCenter.y + offset.y,
    };
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

    // 全員が自分の目標位置（中心点+オフセット）に近づくまで待つ
    const allGathered = [...party.members].every(member => {
      const t = member.getComponent('transform');
      if (!t) return true;
      const offset = this._getFormationOffset(party, member);
      const dx = t.x - (fc.x + offset.x);
      const dy = t.y - (fc.y + offset.y);
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

  _getFormationOffset(party, entity) {
    const members = [...party.members];
    const n = members.length;
    if (n <= 1) return { x: 0, y: 0 };
    const index = members.indexOf(entity);
    const angle = (2 * Math.PI * index) / n;
    return {
      x: Math.cos(angle) * FORMATION_RADIUS,
      y: Math.sin(angle) * FORMATION_RADIUS,
    };
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
