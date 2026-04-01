import { ITEMS } from '../data/Items.js';

export class Equipment {
  constructor(initialItemId = null) {
    this.entity = null;
    this.itemId = initialItemId;
  }

  getItem() {
    return ITEMS[this.itemId] ?? ITEMS.bare_hands;
  }

  getWeapon() {
    const item = this.getItem();
    return item.categories?.includes('weapon') ? item : ITEMS.bare_hands;
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
