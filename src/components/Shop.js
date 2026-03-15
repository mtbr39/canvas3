import createItem from '../entities/Item.js';

const BREAD_PRICE = 10;
const ITEM_SPACING = 20;

export class Shop {
  constructor() {
    this.entity = null;
    this.initialized = false;
  }

  update() {
    if (!this.initialized) {
      this.initialized = true;
      this._spawnInitialItems();
    }
  }

  _spawnInitialItems() {
    const inventory = this.entity.getComponent('inventory');
    const transform = this.entity.getComponent('transform');
    const collider = this.entity.getComponent('collider');
    if (!inventory || !transform) return;

    const count = 10 + Math.floor(Math.random() * 50);
    inventory.capacity = count;

    const w = collider?.shape.width ?? 240;
    const h = collider?.shape.height ?? 180;
    const cols = Math.floor((w - ITEM_SPACING) / ITEM_SPACING);

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = transform.x - w / 2 + ITEM_SPACING + col * ITEM_SPACING;
      const y = transform.y - h / 2 + ITEM_SPACING + row * ITEM_SPACING;

      const bread = createItem(x, y, 'bread');
      if (!bread) break;
      bread.getComponent('itemInfo').setSalePrice(BREAD_PRICE);
      inventory.add(bread);
      this.entity.game.addEntity(bread);
    }
  }

  listItem(itemEntity, price) {
    const itemInfo = itemEntity.getComponent('itemInfo');
    if (!itemInfo) return false;
    itemInfo.setSalePrice(price);
    return true;
  }

  getItemsForSale() {
    const inventory = this.entity.getComponent('inventory');
    if (!inventory) return [];
    return inventory.items.filter(item => {
      const itemInfo = item.getComponent('itemInfo');
      return itemInfo && itemInfo.canPurchase();
    });
  }

  buy(itemEntity, buyerInventory) {
    const shopInventory = this.entity.getComponent('inventory');
    if (!shopInventory) return false;

    const itemInfo = itemEntity.getComponent('itemInfo');
    if (!itemInfo || !itemInfo.canPurchase()) return false;

    if (!shopInventory.remove(itemEntity)) return false;

    itemInfo.setOwner(null);
    buyerInventory.add(itemEntity);
    return true;
  }

  sell(itemEntity, price, sellerInventory) {
    const shopInventory = this.entity.getComponent('inventory');
    if (!shopInventory || shopInventory.isFull()) return false;

    if (sellerInventory && !sellerInventory.remove(itemEntity)) return false;

    shopInventory.add(itemEntity);
    const itemInfo = itemEntity.getComponent('itemInfo');
    if (itemInfo) itemInfo.setSalePrice(price);
    return true;
  }
}
