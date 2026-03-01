import { IdleState } from './IdleState.js';
import { WanderState } from './WanderState.js';
import { CombatState } from './CombatState.js';
import { CollectItemState } from './CollectItemState.js';
import { PartyMoveToState } from './PartyMoveToState.js';
import { SoloMoveToState } from './SoloMoveToState.js';
import { HomeState } from './HomeState.js';

export function createCombatInterruptCheck() {
  return (entity, currentState) => {
    // CombatState中は割り込まない
    if (currentState?.constructor.name === 'CombatState') return null;

    const combat = entity.getComponent('combat');
    if (combat) {
      const enemy = combat.findNearbyEnemy();
      if (enemy) {
        return new CombatState();
      }
    }
    return null;
  };
}

export class DecisionState {
  enter(entity) {
    // DecisionStateに入ったらすぐに次の状態を決定
    this.decideNextState(entity);
  }

  update(entity) {
    // 決定はenterで行うので、updateでは何もしない
  }

  decideNextState(entity) {
    const behavior = entity.getComponent('behavior');
    if (!behavior) return;

    const game = entity.game;

    // パーティがすでに移動中なら合流する
    const party = entity.getComponent('party');
    if (party && party.hasDestination()) {
      const dest = party.getDestination();
      behavior.changeState(new PartyMoveToState(dest.x, dest.y));
      return;
    }

    // パーティ内に戦闘中のメンバーがいる場合は新たな移動を開始しない
    if (party && party.isInParty()) {
      const inCombat = party.getMembers().some(m => {
        const b = m.getComponent('behavior');
        return b?.currentState?.constructor.name === 'CombatState';
      });
      if (inCombat) {
        behavior.changeState(new IdleState());
        return;
      }
    }

    // Check if this entity seeks combat
    const combat = entity.getComponent('combat');
    if (combat && combat.shouldSeekCombat) {
      const transform = entity.getComponent('transform');
      if (transform) {
        const tag = entity.getComponent('tag');
        const enemyTag = tag?.hasTag('human') ? 'monster' : 'human';

        const nearbyEnemies = game.spatialQuery.findNearbyByTag(
          game.entities, transform.x, transform.y, combat.getAttackRange(), enemyTag
        );

        for (const result of nearbyEnemies) {
          const health = result.entity.getComponent('health');
          if (health && !health.isDead) {
            behavior.changeState(new CombatState());
            return;
          }
        }
      }
    }

    // Check if there are nearby items to collect
    const itemCollector = entity.getComponent('itemCollector');
    const inventory = entity.getComponent('inventory');
    if (itemCollector && inventory && !inventory.isFull()) {
      const transform = entity.getComponent('transform');
      if (transform) {
        const nearbyResults = game.spatialQuery.findNearbyEntities(
          game.entities,
          transform.x,
          transform.y,
          200,
          (e) => {
            if (e === entity) return false;
            const itemInfo = e.getComponent('itemInfo');
            return itemInfo && itemInfo.canPickup();
          }
        );

        if (nearbyResults.length > 0) {
          behavior.changeState(new CollectItemState());
          return;
        }
      }
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
      behavior.changeState(new SoloMoveToState(t.x, t.y, new HomeState()));
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
