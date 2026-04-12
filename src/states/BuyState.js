import { DecisionState } from './DecisionState.js';
import { ITEMS } from '../data/Items.js';

const BUY_AMOUNT_MIN = 1;
const BUY_AMOUNT_MAX = 3;

export class BuyState {
  constructor(matcher) {
    this._matcher = matcher;
    this._shopEntity = null;
  }

  static category(cat) {
    return new BuyState(itemType => ITEMS[itemType]?.categories?.includes(cat));
  }

  static item(type) {
    return new BuyState(itemType => itemType === type);
  }

  enter(entity) {
    entity.getComponent('party')?.detach();

    this._shopEntity = this._findNearestShopWith(entity);

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
      this._buy(entity);
      entity.getComponent('party')?.reattach();
      entity.getComponent('behavior').changeState(new DecisionState());
    }
  }

  _buy(entity) {
    const shop = this._shopEntity.getComponent('shop');
    const inventory = entity.getComponent('inventory');
    if (!shop || !inventory) return;

    const forSale = shop.getItemsForSale().filter(item => {
      const info = item.getComponent('itemInfo');
      return info && this._matcher(info.itemType);
    });

    const amount = BUY_AMOUNT_MIN + Math.floor(Math.random() * (BUY_AMOUNT_MAX - BUY_AMOUNT_MIN + 1));
    let bought = 0;
    for (const item of forSale) {
      while (bought < amount) {
        if (!shop.buy(item, inventory)) break;
        bought++;
      }
      if (bought >= amount) break;
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

  _findNearestShopWith(entity) {
    const transform = entity.getComponent('transform');
    const village = this._findCurrentVillage(entity.game, transform.x, transform.y);
    if (!village) return null;

    const vt = village.getComponent('transform');
    const vc = village.getComponent('collider');
    const hw = vc.shape.width / 2;
    const hh = vc.shape.height / 2;

    let nearest = null;
    let nearestDistSq = Infinity;

    for (const e of entity.game.entities) {
      const shop = e.getComponent('shop');
      if (!shop) continue;

      const t = e.getComponent('transform');
      if (Math.abs(t.x - vt.x) > hw || Math.abs(t.y - vt.y) > hh) continue;

      const hasMatch = shop.getItemsForSale().some(item => {
        const info = item.getComponent('itemInfo');
        return info && this._matcher(info.itemType);
      });
      if (!hasMatch) continue;

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

  _findCurrentVillage(game, x, y) {
    for (const e of game.entities) {
      const tag = e.getComponent('tag');
      if (!tag?.hasTag('village')) continue;
      const t = e.getComponent('transform');
      const c = e.getComponent('collider');
      if (!t || !c || c.shape.type !== 'rect') continue;
      const hw = c.shape.width / 2;
      const hh = c.shape.height / 2;
      if (Math.abs(x - t.x) < hw && Math.abs(y - t.y) < hh) return e;
    }
    return null;
  }
}
