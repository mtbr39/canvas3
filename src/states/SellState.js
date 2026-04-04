import { DecisionState } from './DecisionState.js';
import { ITEMS } from '../data/Items.js';

export class SellState {
  constructor(matcher, categories = []) {
    this._matcher = matcher;
    this._categories = categories;
    this._shopEntity = null;
  }

  static category(cat) {
    return new SellState(itemType => ITEMS[itemType]?.categories?.includes(cat), [cat]);
  }

  static item(type) {
    const cats = ITEMS[type]?.categories ?? [];
    return new SellState(itemType => itemType === type, cats);
  }

  _getCategories() {
    return this._categories;
  }

  enter(entity) {
    entity.getComponent('party')?.detach();

    this._shopEntity = this._findNearestShop(entity);

    if (!this._shopEntity) {
      entity.getComponent('party')?.reattach();
      entity.getComponent('behavior').changeState(new DecisionState());
      return;
    }

    const pos = this._randomPointInShop();
    entity.getComponent('movement')?.moveTo(pos.x, pos.y);
  }

  update(entity) {
    if (!this._shopEntity) return;

    const movement = entity.getComponent('movement');
    if (movement?.hasArrived()) {
      this._sell(entity);
      entity.getComponent('party')?.reattach();
      entity.getComponent('behavior').changeState(new DecisionState());
    }
  }

  _sell(entity) {
    const shop = this._shopEntity.getComponent('shop');
    const inventory = entity.getComponent('inventory');
    if (!shop || !inventory) return;

    const toSell = [...inventory.items].filter(item => {
      const info = item.getComponent('itemInfo');
      return info && this._matcher(info.itemType);
    });

    for (const item of toSell) {
      const price = ITEMS[item.getComponent('itemInfo').itemType]?.price ?? 1;
      shop.sell(item, price, inventory);
    }
  }

  _randomPointInShop() {
    const t = this._shopEntity.getComponent('transform');
    const c = this._shopEntity.getComponent('collider');
    const hw = c.shape.width / 2 * 0.8;
    const hh = c.shape.height / 2 * 0.8;
    return {
      x: t.x + (Math.random() - 0.5) * hw * 2,
      y: t.y + (Math.random() - 0.5) * hh * 2,
    };
  }

  _findNearestShop(entity) {
    const transform = entity.getComponent('transform');
    let nearest = null;
    let nearestDistSq = Infinity;

    for (const e of entity.game.entities) {
      const shop = e.getComponent('shop');
      if (!shop) continue;

      const canSellHere = this._getCategories().some(cat => shop.acceptsCategory(cat));
      if (!canSellHere) continue;

      const t = e.getComponent('transform');
      const dx = t.x - transform.x;
      const dy = t.y - transform.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = e;
      }
    }

    return nearest;
  }
}
