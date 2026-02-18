export class Inn {
  constructor() {
    this.capacity = 10;
    this.residents = [];
  }

  admit(humanEntity) {
    if (this.isFull()) return false;
    this.residents.push(humanEntity);
    return true;
  }

  evict(humanEntity) {
    const index = this.residents.indexOf(humanEntity);
    if (index !== -1) {
      this.residents.splice(index, 1);
      return true;
    }
    return false;
  }

  isFull() {
    return this.residents.length >= this.capacity;
  }

  getCount() {
    return this.residents.length;
  }
}
