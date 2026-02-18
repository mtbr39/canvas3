export class Inn {
  constructor() {
    this.residents = [];
    this.partyId = null;
  }

  admit(humanEntity, partyId = null) {
    if (!this.isAvailableForParty(partyId)) return false;
    this.residents.push(humanEntity);
    if (partyId !== null && this.partyId === null) {
      this.partyId = partyId;
    }
    return true;
  }

  evict(humanEntity) {
    const index = this.residents.indexOf(humanEntity);
    if (index !== -1) {
      this.residents.splice(index, 1);
      if (this.residents.length === 0) {
        this.partyId = null;
      }
      return true;
    }
    return false;
  }

  isAvailableForParty(partyId) {
    if (this.residents.length === 0) return true;
    if (partyId === null) return this.partyId === null;
    return this.partyId === partyId;
  }

  getCount() {
    return this.residents.length;
  }
}
