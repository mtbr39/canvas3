import { IdleState } from './IdleState.js';
import { WanderState } from './WanderState.js';
import { CombatState } from './CombatState.js';
import { CollectItemState } from './CollectItemState.js';
import { PartyMoveToState } from './PartyMoveToState.js';
import { SoloMoveToState } from './SoloMoveToState.js';
import { HomeState } from './HomeState.js';
import { EatState, GATHER_RADIUS } from './EatState.js';
import { ITEMS } from '../data/Items.js';
import { debug } from '../core/debug.js';

const _eatLogCooldown = new Map();

export function checkEatCondition(entity) {
  const nutrition = entity.getComponent('nutrition');
  if (!nutrition) return null;

  const inventory = entity.getComponent('inventory');
  const hasFood = inventory?.items.some(item => {
    const info = item.getComponent('itemInfo');
    return ITEMS[info?.itemType]?.category === 'food';
  });

  if (hasFood && nutrition.ratio < 0.4) return new EatState();

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

export function createInterruptCheck() {
  return (entity, currentState) => {
    return _combatCheck(entity, currentState);
  };
}

function _combatCheck(entity, currentState) {
  if (currentState?.constructor.name === 'CombatState') return null;

  const combat = entity.getComponent('combat');
  if (combat) {
    const enemy = combat.findNearbyEnemy();
    if (enemy) return new CombatState();
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

    const game = entity.game;
    const party = entity.getComponent('party');

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
            const state = new CombatState();
            state.target = allyTarget;
            behavior.changeState(state);
            return;
          }
        }
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
    if (resident && !resident.isInLocation('village')) {
      const transform = entity.getComponent('transform');
      const nearestVillage = this._findNearestVillage(game, transform.x, transform.y);
      if (nearestVillage) {
        const dest = this._getVillageEntryPoint(transform, nearestVillage);
        behavior.changeState(new PartyMoveToState(dest.x, dest.y));
        return;
      }
    }

    // Check if homeless and in a village → check into an inn
    if (resident && !resident.home && resident.isInLocation('village')) {
      resident.checkIn();
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

  // 村の縁から margin だけ内側の、最も近い入村地点を返す
  _getVillageEntryPoint(fromTransform, villageEntity, margin = 200) {
    const vt = villageEntity.getComponent('transform');
    const collider = villageEntity.getComponent('collider');
    const hw = collider.shape.width / 2;
    const hh = collider.shape.height / 2;

    // fromTransform から最も近い矩形境界上の点
    const edgeX = Math.max(vt.x - hw, Math.min(fromTransform.x, vt.x + hw));
    const edgeY = Math.max(vt.y - hh, Math.min(fromTransform.y, vt.y + hh));

    // 境界点から中心へ margin 分引き込む
    const dx = vt.x - edgeX;
    const dy = vt.y - edgeY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= margin) return { x: vt.x, y: vt.y };

    return {
      x: edgeX + (dx / dist) * margin,
      y: edgeY + (dy / dist) * margin,
    };
  }
}
