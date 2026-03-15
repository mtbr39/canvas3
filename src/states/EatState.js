import { DecisionState } from './DecisionState.js';
import { ITEMS } from '../data/Items.js';

export const GATHER_RADIUS = 120;
const EATING_TIME = 30;
const WAIT_TIMEOUT = 15;

export class EatState {
  constructor() {
    this.phase = null; // 'cooking' | 'eating' | 'waiting'
    this.timer = 0;
    this._foodItem = null;
  }

  enter(entity) {
    entity.getComponent('movement')?.stop();
    entity.getComponent('party')?.detach();

    const inventory = entity.getComponent('inventory');
    this._foodItem = this._findFood(inventory);

    if (this._foodItem) {
      const itemData = ITEMS[this._foodItem.getComponent('itemInfo').itemType];
      if (itemData.cookingTime) {
        this.phase = 'cooking';
        this.timer = itemData.cookingTime;
      } else {
        this.phase = 'eating';
        this.timer = EATING_TIME;
      }
    } else {
      // 食料なし → 仲間の料理を待つ
      this.phase = 'waiting';
      this.timer = WAIT_TIMEOUT;
    }
  }

  update(entity) {
    if (this.phase === 'waiting') {
      this.timer -= entity.game.deltaTime;
      if (this.timer <= 0) {
        // タイムアウト → あきらめる
        entity.getComponent('party')?.reattach();
        entity.getComponent('behavior').changeState(new DecisionState());
      }
      return;
    }

    this.timer -= entity.game.deltaTime;
    if (this.timer <= 0) {
      if (this.phase === 'cooking') {
        this._serveMeal(entity);
        this.phase = 'eating';
        this.timer = EATING_TIME;
      } else {
        this._finish(entity);
      }
    }
  }

  // 配膳される（仲間の調理完成時に呼ばれる）
  served(entity, nutritionAmount) {
    entity.getComponent('nutrition')?.eat(nutritionAmount);
    this.phase = 'eating';
    this.timer = EATING_TIME;
  }

  // 調理完成 → 近くのwaitingメンバーに配膳
  _serveMeal(entity) {
    const inventory = entity.getComponent('inventory');
    const itemData = ITEMS[this._foodItem.getComponent('itemInfo').itemType];
    inventory.remove(this._foodItem);

    // 自分も食べる
    entity.getComponent('nutrition')?.eat(itemData.nutrition ?? 30);

    // 近くのwaitingメンバーに配る
    const transform = entity.getComponent('transform');
    const party = entity.getComponent('party');
    if (!party?.isInParty()) return;

    for (const member of party.getMembers()) {
      if (member === entity) continue;
      const memberState = member.getComponent('behavior')?.currentState;
      if (!(memberState instanceof EatState) || memberState.phase !== 'waiting') continue;

      const mt = member.getComponent('transform');
      const dx = mt.x - transform.x;
      const dy = mt.y - transform.y;
      if (dx * dx + dy * dy > GATHER_RADIUS * GATHER_RADIUS) continue;

      memberState.served(member, itemData.nutrition ?? 30);
    }
  }

  _finish(entity) {
    // 調理なしで食べた場合（bread等）はここで消費
    if (this._foodItem) {
      const inventory = entity.getComponent('inventory');
      if (inventory?.items.includes(this._foodItem)) {
        const itemData = ITEMS[this._foodItem.getComponent('itemInfo').itemType];
        inventory.remove(this._foodItem);
        entity.getComponent('nutrition')?.eat(itemData.nutrition ?? 30);
      }
    }

    entity.getComponent('party')?.reattach();
    entity.getComponent('behavior').changeState(new DecisionState());
  }

  _findFood(inventory) {
    if (!inventory) return null;
    return inventory.items.find(item => {
      const info = item.getComponent('itemInfo');
      return ITEMS[info?.itemType]?.category === 'food';
    }) ?? null;
  }
}
