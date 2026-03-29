import { CombatState } from './CombatState.js';
import { DecisionState } from './DecisionState.js';
import { PartyMoveToState } from './PartyMoveToState.js';

const HUNT_RANGE = 2000;

export class HuntingState {
  enter(entity) {
    const behavior = entity.getComponent('behavior');

    if (this._shouldReturnToTown(entity)) {
      this._returnToTown(entity);
      return;
    }

    const target = this._findNearestEnemy(entity);
    if (!target) {
      this._returnToTown(entity);
      return;
    }

    const state = new CombatState(new HuntingState());
    state.target = target;
    behavior.changeState(state);
  }

  update() {}
  exit() {}

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
      const dest = this._getVillageEntryPoint(transform, village);
      behavior.changeState(new PartyMoveToState(dest.x, dest.y));
    } else {
      behavior.changeState(new DecisionState());
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

  _getVillageEntryPoint(fromTransform, villageEntity, margin = 200) {
    const vt = villageEntity.getComponent('transform');
    const collider = villageEntity.getComponent('collider');
    const hw = collider.shape.width / 2;
    const hh = collider.shape.height / 2;

    const edgeX = Math.max(vt.x - hw, Math.min(fromTransform.x, vt.x + hw));
    const edgeY = Math.max(vt.y - hh, Math.min(fromTransform.y, vt.y + hh));

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
