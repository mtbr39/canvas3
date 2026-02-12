class Inventory {
  constructor() {
    this.items = [];
    this.capacity = 20;
  }

  add(itemEntity) {
    if (this.items.length >= this.capacity) return false;
    this.items.push(itemEntity);
    return true;
  }

  remove(itemEntity) {
    const index = this.items.indexOf(itemEntity);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
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
