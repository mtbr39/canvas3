class Inventory {
  constructor() {
    this.items = [];
    this.capacity = 20;
  }

  add(item) {
    if (this.items.length >= this.capacity) return false;
    this.items.push(item);
    return true;
  }

  remove(item) {
    const i = this.items.indexOf(item);
    if (i === -1) return false;
    this.items.splice(i, 1);
    return true;
  }

  findByType(itemType) {
    return this.items.find(e => e.getComponent('itemInfo')?.itemType === itemType) ?? null;
  }

  isFull() {
    return this.items.length >= this.capacity;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  getCount() {
    return this.items.length;
  }
}

export default Inventory;
