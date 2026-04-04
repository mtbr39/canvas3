import createItem from '../entities/Item.js';
import { ITEMS } from '../data/Items.js';
import { transfer, give } from './ItemExchanger.js';

const ITEM_SPACING = 35;
const ITEM_MARGIN = 25;

export class Shop {
  constructor(acceptsCategories = []) {
    this.entity = null;
    this.initialized = false;
    this.acceptsCategories = acceptsCategories;
  }

  acceptsCategory(cat) {
    return this.acceptsCategories.includes(cat);
  }

  update() {
    if (!this.initialized) {
      this.initialized = true;
      this._spawnInitialItems();
    }
    this._layoutItems();
  }

  _layoutItems() {
    const inventory = this.entity.getComponent('inventory');
    const transform = this.entity.getComponent('transform');
    const collider = this.entity.getComponent('collider');
    if (!inventory || !transform || !collider) return;

    const w = collider.shape.width;
    const cols = Math.max(1, Math.floor((w - ITEM_MARGIN * 2) / ITEM_SPACING));

    inventory.items.forEach((item, i) => {
      const t = item.getComponent('transform');
      if (!t) return;
      const col = i % cols;
      const row = Math.floor(i / cols);
      t.x = transform.x - w / 2 + ITEM_MARGIN + col * ITEM_SPACING;
      t.y = transform.y - collider.shape.height / 2 + ITEM_MARGIN + row * ITEM_SPACING;
    });
  }

  _spawnInitialItems() {
    if (this.acceptsCategory('material')) {
      this._spawnInitialCoins();
      return;
    }
    this._spawnBread();
  }

  _spawnBread() {
    const inventory = this.entity.getComponent('inventory');
    const transform = this.entity.getComponent('transform');
    if (!inventory || !transform) return;

    const count = 10 + Math.floor(Math.random() * 50);
    inventory.capacity = count;

    const bread = createItem(transform.x, transform.y, 'bread');
    if (!bread) return;
    bread.getComponent('itemInfo').quantity = count;
    const received = give(bread, inventory);
    received.getComponent('itemInfo').setPrice(ITEMS['bread'].price ?? 1);
  }

  _spawnInitialCoins() {
    const inventory = this.entity.getComponent('inventory');
    const transform = this.entity.getComponent('transform');
    if (!inventory || !transform) return;

    inventory.capacity = 100;
    const amount = 50 + Math.floor(Math.random() * 50);
    const coin = createItem(transform.x, transform.y, 'coin');
    coin.getComponent('itemInfo').quantity = amount;
    give(coin, inventory);
  }

  getItemsForSale() {
    const inventory = this.entity.getComponent('inventory');
    if (!inventory) return [];
    return inventory.items.filter(item => item.getComponent('itemInfo')?.price > 0);
  }

  buy(itemEntity, buyerInventory) {
    const shopInventory = this.entity.getComponent('inventory');
    if (!shopInventory) return false;

    const itemInfo = itemEntity.getComponent('itemInfo');
    if (!itemInfo || itemInfo.price === 0) return false;
    if (itemInfo.owner !== this.entity.id) return false;

    const price = itemInfo.price;
    const buyerCoins = buyerInventory.findByType('coin');
    if (!buyerCoins || buyerCoins.getComponent('itemInfo').quantity < price) return false;

    const itemType = itemInfo.itemType;
    if (!buyerInventory.findByType(itemType) && buyerInventory.isFull()) return false;

    transfer(buyerCoins, buyerInventory, shopInventory, price);
    transfer(itemEntity, shopInventory, buyerInventory, 1);
    return true;
  }

  sell(itemEntity, price, sellerInventory) {
    const shopInventory = this.entity.getComponent('inventory');
    if (!shopInventory) return false;

    const itemType = itemEntity.getComponent('itemInfo').itemType;
    if (!shopInventory.findByType(itemType) && shopInventory.isFull()) return false;

    const shopCoins = shopInventory.findByType('coin');
    if (!shopCoins || shopCoins.getComponent('itemInfo').quantity < price) return false;

    const maxAffordable = Math.floor(shopCoins.getComponent('itemInfo').quantity / price);
    const qty = Math.min(itemEntity.getComponent('itemInfo').quantity, maxAffordable);
    const totalPrice = price * qty;

    transfer(shopCoins, shopInventory, sellerInventory, totalPrice);
    const received = transfer(itemEntity, sellerInventory, shopInventory, qty);
    received.getComponent('itemInfo').setPrice(price);
    return true;
  }
}
