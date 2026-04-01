import { ITEMS, DEFAULT_ITEM } from '../data/Items.js';

export class Equipment {
  constructor(initialItemId = null) {
    this.entity = null;
    this.itemId = initialItemId;
  }

  getItem() {
    if (!this.itemId) {
      return DEFAULT_ITEM;
    }
    return ITEMS[this.itemId] || DEFAULT_ITEM;
  }

  getWeapon() {
    const item = this.getItem();
    return item.categories?.includes('weapon') ? item : DEFAULT_ITEM;
  }

  equip(itemId) {
    if (ITEMS[itemId]) {
      this.itemId = itemId;
      return true;
    }
    return false;
  }

  unequip() {
    this.itemId = null;
  }

  getItemId() {
    return this.itemId;
  }
}
