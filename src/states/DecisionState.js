import { IdleState } from './IdleState.js';
import { WanderState } from './WanderState.js';
import { CombatState } from './CombatState.js';
import { CollectItemState } from './CollectItemState.js';
import { PartyMoveToState } from './PartyMoveToState.js';
import { SoloMoveToState } from './SoloMoveToState.js';
import { HomeState } from './HomeState.js';
import { EatState, GATHER_RADIUS } from './EatState.js';
import { BuyState } from './BuyState.js';
import { SellState } from './SellState.js';
import { HuntingState } from './HuntingState.js';
import { ReviveState } from './ReviveState.js';
import { ITEMS } from '../data/Items.js';
import { debug } from '../core/debug.js';
import { DeadState } from './DeadState.js';

const EAT_ANYWHERE_THRESHOLD = 0.1;  // この値以下ならどこでも食べる
const EAT_AT_HOME_THRESHOLD = 0.4;  // この値以下なら家にいるときに食べる
const BUY_THRESHOLD = 0.6;          // この値以下で食料を買いに行く

const _eatLogCooldown = new Map();

export function checkEatCondition(entity) {
  const nutrition = entity.getComponent('nutrition');
  if (!nutrition) return null;

  const inventory = entity.getComponent('inventory');
  const hasFood = inventory?.items.some(item => {
    const info = item.getComponent('itemInfo');
    return ITEMS[info?.itemType]?.categories?.includes('food');
  });

  if (hasFood && nutrition.ratio < EAT_ANYWHERE_THRESHOLD) return new EatState();

  const isAtHome = entity.getComponent('behavior')?.currentState instanceof HomeState;
  if (hasFood && isAtHome && nutrition.ratio < EAT_AT_HOME_THRESHOLD) return new EatState();

  // 3秒に1回だけログ
  const now = Date.now();
  if ((now - (_eatLogCooldown.get(entity.id) ?? 0)) > 3000) {
    _eatLogCooldown.set(entity.id, now);
    if (hasFood) {
      debug.log(`[checkEat #${entity.id}] 食料あり ratio=${nutrition.ratio.toFixed(2)} (空腹でない)`);
    } else if (nutrition.ratio < 0.4) {
      debug.log(`[checkEat #${entity.id}] 空腹だが食料なし ratio=${nutrition.ratio.toFixed(2)}`);
    }
  }

  return null;
}

const SELL_FOOD_THRESHOLD = 5;
const HUNT_COIN_THRESHOLD = 10;

function checkSellCondition(inventory) {
  if (!inventory) return null;

  const hasMaterial = inventory.items.some(item => {
    const info = item.getComponent('itemInfo');
    return ITEMS[info?.itemType]?.categories?.includes('material');
  });
  if (hasMaterial) return SellState.category('material');

  const foodCount = inventory.items.reduce((sum, item) => {
    const info = item.getComponent('itemInfo');
    if (ITEMS[info?.itemType]?.categories?.includes('food')) {
      return sum + info.quantity;
    }
    return sum;
  }, 0);
  if (foodCount >= SELL_FOOD_THRESHOLD) return SellState.category('food');

  return null;
}

export function createInterruptCheck() {
  return (entity, currentState) => {
    return _combatCheck(entity, currentState);
  };
}

function _combatCheck(entity, currentState) {
  if (entity.getComponent('health')?.isDead) return null;
  if (currentState?.constructor.name === 'CombatState') return null;

  const combat = entity.getComponent('combat');
  if (combat) {
    const enemy = combat.findNearbyEnemy();
    if (enemy) return new CombatState(currentState);
  }
  return null;
}

export class DecisionState {
  enter(entity) {
    // DecisionStateに入ったらすぐに次の状態を決定
    this.decideNextState(entity);
  }

  update(_entity) {
    // 決定はenterで行うので、updateでは何もしない
  }

  decideNextState(entity) {
    const behavior = entity.getComponent('behavior');
    if (!behavior) return;

    if (entity.getComponent('health')?.isDead) {
      behavior.changeState(new DeadState());
      return;
    }

    const game = entity.game;
    const party = entity.getComponent('party');


    // パーティ内に死んでいるメンバーがいれば蘇生しに行く
    if (party?.isInParty()) {
      const deadMember = party.getMembers().find(m =>
        m !== entity && m.getComponent('health')?.isDead
      );
      const combat = entity.getComponent('combat');
      if (deadMember && !combat?.findNearbyEnemy()) {
        behavior.changeState(new ReviveState(deadMember));
        return;
      }
    }

    // パーティ内に戦闘中のメンバーがいる場合
    if (party && party.isInParty()) {
      const fightingMember = party.getMembers().find(m => {
        const b = m.getComponent('behavior');
        return b?.currentState?.constructor.name === 'CombatState';
      });
      if (fightingMember) {
        const combat = entity.getComponent('combat');
        if (combat) {
          const allyTarget = fightingMember.getComponent('behavior').currentState.getTarget();
          if (allyTarget) {
            const dist = entity.game.spatialQuery.getDistance(entity, allyTarget);
            if (dist <= combat.chaseRange) {
              const state = new CombatState();
              state.target = allyTarget;
              behavior.changeState(state);
              return;
            }
          }
        }
      }
    }
    
    // Check if there are nearby items to collect
    const itemCollector = entity.getComponent('itemCollector');
    if (itemCollector && itemCollector.findNearbyItem()) {
      behavior.changeState(new CollectItemState());
      return;
    }

    // 食事判断
    const eatState = checkEatCondition(entity);
    if (eatState) {
      behavior.changeState(eatState);
      return;
    }

    // パーティメンバーが調理中 → 必ず集まる（空腹度に関わらず）
    if (party?.isInParty()) {
      const cook = party.getMembers().find(m => {
        const state = m.getComponent('behavior')?.currentState;
        return m !== entity && state instanceof EatState && state.phase === 'cooking';
      });
      if (cook) {
        const t = cook.getComponent('transform');
        const members = party.getMembers().filter(m => m !== cook);
        const myIndex = members.indexOf(entity);
        const total = Math.max(members.length, 1);
        const angle = (myIndex / total) * Math.PI * 2;
        const radius = GATHER_RADIUS * 0.7;
        const tx = t.x + Math.cos(angle) * radius;
        const ty = t.y + Math.sin(angle) * radius;
        behavior.changeState(new SoloMoveToState(tx, ty, new EatState()));
        return;
      }
    }

    // パーティがすでに移動中なら合流する
    if (party && party.hasDestination()) {
      const dest = party.getDestination();
      behavior.changeState(new PartyMoveToState(dest.x, dest.y));
      return;
    }

    // Check if this entity seeks combat
    const combat = entity.getComponent('combat');
    if (combat && combat.shouldSeekCombat && combat.findNearbyEnemy()) {
      behavior.changeState(new CombatState());
      return;
    }

    // 村にいなければ最寄りの村へ向かう
    const resident = entity.getComponent('resident');
    if (resident && !resident.home) {
      const transform = entity.getComponent('transform');
      if (!this._isInsideAnyVillage(game, transform.x, transform.y)) {
        const nearestVillage = this._findNearestVillage(game, transform.x, transform.y);
        if (nearestVillage) {
          const dest = this._getVillageEntryPoint(nearestVillage);
          behavior.changeState(new PartyMoveToState(dest.x, dest.y));
          return;
        }
      } else {
        resident.checkIn();
      }
    }

    // 売却判断
    const inventory = entity.getComponent('inventory');
    const sellState = checkSellCondition(inventory);
    if (sellState) {
      behavior.changeState(sellState);
      return;
    }

    // 食料購入判断：栄養60以下で手持ちに食料がなければ買いに行く
    const nutrition = entity.getComponent('nutrition');
    if (nutrition && nutrition.ratio <= BUY_THRESHOLD) {
      const hasFood = inventory?.items.some(item => {
        const info = item.getComponent('itemInfo');
        return ITEMS[info?.itemType]?.categories?.includes('food');
      });
      const hasCoins = inventory?.items.some(item =>
        item.getComponent('itemInfo')?.itemType === 'coin'
      );
      if (!hasFood && hasCoins) {
        behavior.changeState(BuyState.category('food'));
        return;
      }
    }

    // コインが少なければ狩りに行く（攻撃的なエンティティのみ）
    if (combat && combat.shouldSeekCombat && inventory) {
      const coins = inventory.findByType('coin');
      const coinCount = coins?.getComponent('itemInfo')?.quantity ?? 0;
      if (coinCount <= HUNT_COIN_THRESHOLD) {
        behavior.changeState(new HuntingState());
        return;
      }
    }

    // 家があれば帰宅する
    if (resident?.home) {
      const t = resident.home.getComponent('transform');
      const c = resident.home.getComponent('collider');
      const hw = c.shape.width / 2 * 0.8;
      const hh = c.shape.height / 2 * 0.8;
      const tx = t.x + (Math.random() - 0.5) * hw * 2;
      const ty = t.y + (Math.random() - 0.5) * hh * 2;
      behavior.changeState(new SoloMoveToState(tx, ty, new HomeState()));
      return;
    }

    // Default: Idle or Wander
    if (Math.random() < 0.5) {
      behavior.changeState(new IdleState());
    } else {
      behavior.changeState(new WanderState());
    }
  }

  _findNearestVillage(game, x, y) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const entity of game.entities) {
      const tag = entity.getComponent('tag');
      if (!tag || !tag.hasTag('village')) continue;
      const t = entity.getComponent('transform');
      if (!t) continue;
      const dx = t.x - x;
      const dy = t.y - y;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = entity;
      }
    }
    return nearest;
  }

  _isInsideAnyVillage(game, x, y) {
    for (const entity of game.entities) {
      const tag = entity.getComponent('tag');
      if (!tag || !tag.hasTag('village')) continue;
      const t = entity.getComponent('transform');
      const collider = entity.getComponent('collider');
      if (!t || !collider || collider.shape.type !== 'rect') continue;
      const hw = collider.shape.width / 2;
      const hh = collider.shape.height / 2;
      if (Math.abs(x - t.x) < hw && Math.abs(y - t.y) < hh) return true;
    }
    return false;
  }

  _getVillageEntryPoint(villageEntity) {
    const vt = villageEntity.getComponent('transform');
    const collider = villageEntity.getComponent('collider');
    const hw = collider.shape.width / 2 * 0.8;
    const hh = collider.shape.height / 2 * 0.8;
    return {
      x: vt.x + (Math.random() - 0.5) * hw * 2,
      y: vt.y + (Math.random() - 0.5) * hh * 2,
    };
  }
}
