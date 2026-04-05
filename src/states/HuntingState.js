import { CombatState } from './CombatState.js';
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

    const target = this._findNearestEnemy(entity);
    if (!target) {
      this._returnToTown(entity);
      return;
    }

    this.target = target;
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
      this.target = this._findNearestEnemy(entity);
      if (!this.target) {
        this._returnToTown(entity);
        return;
      }
    }

    const combat = entity.getComponent('combat');
    const dist = entity.game.spatialQuery.getDistance(entity, this.target);
    if (dist <= combat.detectionRange) {
      const behavior = entity.getComponent('behavior');
      const state = new CombatState(new HuntingState());
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

  _findNearestEnemy(entity) {
    const transform = entity.getComponent('transform');
    if (!transform) return null;

    const game = entity.game;
    const tag = entity.getComponent('tag');
    const enemyTag = tag?.hasTag('human') ? 'monster' : 'human';

    const nearbyEnemies = game.spatialQuery.findNearbyByTag(
      game.entities, transform.x, transform.y, HUNT_RANGE, enemyTag
    );

    for (const result of nearbyEnemies) {
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
