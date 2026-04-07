import { DecisionState } from './DecisionState.js';

export class QuestState {
  constructor() {
    this.phase = 'travel_to_nearest_village';
    this._destinationSet = false;
    this._reportGuild = null;
  }

  getLabel() {
    const short = { travel_to_nearest_village: 'ToVillage', check_in: 'CheckIn', travel_to_target: 'ToTarget', report: 'Report' };
    return `Quest:${short[this.phase] ?? this.phase}`;
  }

  enter(entity) {
    entity.getComponent('party')?.reattach();
    this._runPhase(entity);
  }

  update(entity) {
    this._runPhase(entity);
  }

  exit(_entity) {}

  _setPhase(phase) {
    this.phase = phase;
    this._destinationSet = false;
  }

  _runPhase(entity) {
    const behavior = entity.getComponent('behavior');
    const party = entity.getComponent('party');
    const questHolder = entity.getComponent('questHolder');

    if (!questHolder?.currentQuest) {
      behavior.changeState(new DecisionState());
      return;
    }

    switch (this.phase) {
      case 'travel_to_nearest_village': {
        if (!this._destinationSet) {
          const target = questHolder.currentQuest.targetEntity;
          const targetT = target.getComponent('transform');
          const village = this._findNearestVillage(entity.game, targetT.x, targetT.y);
          if (village) {
            const dest = this._getVillagePoint(village);
            this._movePartyTo(entity, party, dest.x, dest.y);
          }
          this._destinationSet = true;
        } else if (!this._isMoving(entity, party)) {
          this._setPhase('check_in');
        }
        break;
      }

      case 'check_in': {
        entity.getComponent('resident')?.checkIn();
        this._setPhase('travel_to_target');
        break;
      }

      case 'travel_to_target': {
        const target = questHolder.currentQuest.targetEntity;
        if (!target || target.getComponent('health')?.isDead) {
          this._setPhase('report');
          break;
        }
        if (!this._destinationSet) {
          const t = target.getComponent('transform');
          this._movePartyTo(entity, party, t.x, t.y);
          this._destinationSet = true;
        } else if (!this._isMoving(entity, party)) {
          // arrived but combat didn't trigger (monster fled?) - re-set destination
          this._destinationSet = false;
        }
        break;
      }

      case 'report': {
        if (!this._destinationSet) {
          const guild = this._findNearestGuild(entity);
          if (guild) {
            this._reportGuild = guild;
            const t = guild.getComponent('transform');
            this._movePartyTo(entity, party, t.x, t.y);
          }
          this._destinationSet = true;
        } else if (!this._isMoving(entity, party)) {
          if (this._reportGuild) {
            this._reportGuild.getComponent('guild')?.completeQuest(questHolder.currentQuest, entity);
          }
          questHolder.complete();
          // propagate quest clear to party members
          if (party?.isInParty()) {
            for (const member of party.getMembers()) {
              if (member !== entity) {
                member.getComponent('questHolder')?.complete();
              }
            }
          }
          behavior.changeState(new DecisionState());
        }
        break;
      }
    }
  }

  _movePartyTo(entity, party, x, y) {
    if (party?.isInParty()) {
      party.setDestination(x, y);
    } else {
      entity.getComponent('movement')?.moveTo(x, y);
    }
  }

  _isMoving(entity, party) {
    if (party?.isInParty()) {
      return party.hasDestination();
    }
    return !entity.getComponent('movement')?.hasArrived();
  }

  _findNearestVillage(game, x, y) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const e of game.entities) {
      if (!e.getComponent('tag')?.hasTag('village')) continue;
      const t = e.getComponent('transform');
      if (!t) continue;
      const d = (t.x - x) ** 2 + (t.y - y) ** 2;
      if (d < nearestDist) { nearestDist = d; nearest = e; }
    }
    return nearest;
  }

  _getVillagePoint(village) {
    const t = village.getComponent('transform');
    const c = village.getComponent('collider');
    const hw = c.shape.width / 2 * 0.8;
    const hh = c.shape.height / 2 * 0.8;
    return {
      x: t.x + (Math.random() - 0.5) * hw * 2,
      y: t.y + (Math.random() - 0.5) * hh * 2,
    };
  }

  _findNearestGuild(entity) {
    let nearest = null;
    let nearestDist = Infinity;
    const selfT = entity.getComponent('transform');
    for (const e of entity.game.entities) {
      if (!e.getComponent('guild')) continue;
      const t = e.getComponent('transform');
      if (!t) continue;
      const d = (t.x - selfT.x) ** 2 + (t.y - selfT.y) ** 2;
      if (d < nearestDist) { nearestDist = d; nearest = e; }
    }
    return nearest;
  }
}
