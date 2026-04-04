import createItem from '../entities/Item.js';

class Inventory {
  constructor() {
    this.items = [];
    this.capacity = 20;
  }

  add(itemEntity) {
    const itemInfo = itemEntity.getComponent('itemInfo');
    if (itemInfo) {
      const existing = this._findByType(itemInfo.itemType);
      if (existing) {
        existing.getComponent('itemInfo').quantity += itemInfo.quantity;
        this.entity.game.markEntityForRemoval(itemEntity);
        return true;
      }
    }
    if (this.items.length >= this.capacity) return false;
    this.items.push(itemEntity);
    return true;
  }

  takeOne(itemEntity) {
    const itemInfo = itemEntity.getComponent('itemInfo');
    if (!itemInfo) return null;

    if (itemInfo.quantity > 1) {
      itemInfo.quantity--;
      const transform = itemEntity.getComponent('transform');
      const split = createItem(transform.x, transform.y, itemInfo.itemType);
      this.entity.game.addEntity(split);
      return split;
    }

    this.remove(itemEntity);
    return itemEntity;
  }

  _findByType(itemType) {
    return this.items.find(e => e.getComponent('itemInfo')?.itemType === itemType) ?? null;
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
