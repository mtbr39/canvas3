import { debug } from '../core/debug.js';
import { CombatState } from './CombatState.js';
import { DecisionState } from './DecisionState.js';
import { PartyMoveToState } from './PartyMoveToState.js';
import { WanderState } from './WanderState.js';

const HUNT_RANGE = 2000;

export class HuntingState {
  constructor() {
    this.target = null;
  }

  enter(entity) {
    if (this._shouldReturnToTown(entity)) {
      this._returnToTown(entity);
      return;
    }

    const target = this._getPartyHuntTarget(entity) ?? this._findNearestEnemy(entity);
    if (!target) {
      this._returnToTown(entity);
      return;
    }

    this.target = target;
    debug.log(`[Hunt #${entity.id}] target=${this.target.id}`);
    const targetTransform = target.getComponent('transform');
    entity.getComponent('movement')?.moveTo(targetTransform.x, targetTransform.y);
  }

  update(entity) {
    if (this._shouldReturnToTown(entity)) {
      this._returnToTown(entity);
      return;
    }

    const health = this.target?.getComponent('health');
    if (!this.target || (health && health.isDead)) {
      this.target = this._getPartyHuntTarget(entity) ?? this._findNearestEnemy(entity);
      if (!this.target) {
        debug.log(`[Hunt #${entity.id}] no enemy found, returning to town`);
        this._returnToTown(entity);
        return;
      }
      debug.log(`[Hunt #${entity.id}] new target=${this.target.id}`);
    }

    const combat = entity.getComponent('combat');
    const dist = entity.game.spatialQuery.getDistance(entity, this.target);
    if (dist <= combat.detectionRange) {
      debug.log(`[Hunt #${entity.id}] entering combat with target=${this.target.id}`);
      const behavior = entity.getComponent('behavior');
      const state = new CombatState(new DecisionState());
      state.target = this.target;
      behavior.changeState(state);
      return;
    }

    const targetTransform = this.target.getComponent('transform');
    entity.getComponent('movement')?.moveTo(targetTransform.x, targetTransform.y);
  }

  exit(entity) {
    entity.getComponent('movement')?.stop();
    this.target = null;
  }

  // パーティ内の別メンバーがすでに狙っているターゲットを返す
  _getPartyHuntTarget(entity) {
    const party = entity.getComponent('party');
    if (!party?.isInParty()) return null;

    for (const member of party.getMembers()) {
      if (member === entity) continue;
      const state = member.getComponent('behavior')?.currentState;
      if (state instanceof HuntingState && state.target) {
        const health = state.target.getComponent('health');
        if (health && !health.isDead) return state.target;
      }
      if (state instanceof CombatState && state.returnState instanceof HuntingState) {
        const target = state.getTarget();
        if (target) return target;
      }
    }
    return null;
  }

  // 他パーティがすでに狙っているモンスターのSet
  _getTargetsOfOtherParties(entity) {
    const party = entity.getComponent('party');
    const targeted = new Set();

    for (const e of entity.game.entities) {
      if (party?.isAlly(e) || e === entity) continue;
      const state = e.getComponent('behavior')?.currentState;
      if (state instanceof HuntingState && state.target) {
        targeted.add(state.target);
      }
      if (state instanceof CombatState && state.returnState instanceof HuntingState) {
        const t = state.getTarget();
        if (t) targeted.add(t);
      }
    }
    return targeted;
  }

  _findNearestEnemy(entity) {
    const transform = entity.getComponent('transform');
    if (!transform) return null;

    const game = entity.game;
    const tag = entity.getComponent('tag');
    const enemyTag = tag?.hasTag('human') ? 'monster' : 'human';

    const nearbyEnemies = game.spatialQuery.findNearbyByTag(
      game.entities, transform.x, transform.y, HUNT_RANGE, enemyTag
    );

    const otherTargets = this._getTargetsOfOtherParties(entity);

    for (const result of nearbyEnemies) {
      if (otherTargets.has(result.entity)) continue;
      const health = result.entity.getComponent('health');
      if (health && !health.isDead) return result.entity;
    }
    return null;
  }

  _shouldReturnToTown(entity) {
    const vitality = entity.getComponent('vitality');
    if (vitality && vitality.current <= 0) return true;

    const party = entity.getComponent('party');
    if (party?.isInParty()) {
      for (const member of party.getMembers()) {
        const health = member.getComponent('health');
        if (health?.isDead) return true;
      }
    }

    return false;
  }

  _returnToTown(entity) {
    const behavior = entity.getComponent('behavior');
    const transform = entity.getComponent('transform');

    const village = this._findNearestVillage(entity.game, transform.x, transform.y);
    if (village) {
      const dest = this._getVillageEntryPoint(village);
      behavior.changeState(new PartyMoveToState(dest.x, dest.y));
    } else {
      behavior.changeState(new WanderState());
    }
  }

  _findNearestVillage(game, x, y) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const entity of game.entities) {
      const tag = entity.getComponent('tag');
      if (!tag?.hasTag('village')) continue;
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
