import { colors } from '../data/Colors.js';

const SHOW_PARTY_LINES = true;

export class InfoRenderer {
  constructor() {
    this.entity = null;
    this.showNutrition = true;
  }

  getStateLabel(state) {
    const name = state.constructor.name;
    if (name === 'CombatState' && state.returnState?.constructor.name === 'HuntingState') {
      return 'Hunt(Combat)';
    }
    return name;
  }

  isCameraCloseEnough() {
    return this.entity.game.camera.zoom >= 1.0;
  }

  isVisible() {
    return this.isCameraCloseEnough();
  }

  render() {
    if (!this.isVisible()) return;
    const game = this.entity.game;

    const transform = this.entity.getComponent('transform');
    const health = this.entity.getComponent('health');
    if (!transform || !health) return;

    const collider = this.entity.getComponent('collider');
    let offsetY = 25;
    if (collider) {
      offsetY = collider.shape.type === 'circle'
        ? collider.shape.radius
        : collider.shape.height / 2;
    }

    const lines = [
      `HP ${health.currentHealth}/${health.maxHealth}`,
    ];

    const behavior = this.entity.getComponent('behavior');
    if (behavior?.currentState) {
      lines.push(this.getStateLabel(behavior.currentState));
    }

    const eatState = behavior?.currentState?.constructor.name === 'EatState'
      ? behavior.currentState : null;
    if (eatState) {
      const label = eatState.phase === 'cooking' ? '調理中'
        : eatState.phase === 'waiting' ? '仲間の調理を待っている'
        : eatState.phase === 'eating'  ? '食事中'
        : null;
      if (label) lines.push(label);
    }

    if (game.debug) {
      if (behavior && behavior.currentState) {
        const state = behavior.currentState;
        let stateLabel = state.constructor.name;
        const liveTarget = state.getTarget ? state.getTarget() : null;
        if (liveTarget) {
          const targetTag = liveTarget.getComponent('tag');
          stateLabel += ` → ${targetTag ? targetTag.tags.join(',') : '?'}`;
        } else if (state.constructor.name === 'CombatState') {
          stateLabel += ' (no target)';
        }
lines.push(stateLabel);
        if (liveTarget) {
          const dist = Math.round(game.spatialQuery.getDistance(this.entity, liveTarget));
          const combat = this.entity.getComponent('combat');
          const range = combat ? Math.round(combat.getWeaponRange()) : '?';
          const seek = combat ? (combat.shouldSeekCombat ? 'seek' : 'flee') : '?';
          const movement = this.entity.getComponent('movement');
          const moving = movement?.moving ? 'moving' : 'stopped';
          lines.push(`${seek} dist:${dist} range:${range} ${moving}`);
        }
      }

      const nutrition = this.entity.getComponent('nutrition');
      if (nutrition) lines.push(`栄養 ${Math.floor(nutrition.current)}/${nutrition.max}`);

      const vitality = this.entity.getComponent('vitality');
      if (vitality) lines.push(`気力 ${Math.floor(vitality.current)}/${vitality.max}`);
    } else if (this.showNutrition) {
      const nutrition = this.entity.getComponent('nutrition');
      if (nutrition) lines.push(`栄養 ${Math.floor(nutrition.current)}/${nutrition.max}`);

      const vitality = this.entity.getComponent('vitality');
      if (vitality) lines.push(`気力 ${Math.floor(vitality.current)}/${vitality.max}`);
    }

    const lineHeight = 14;
    lines.forEach((line, i) => {
      game.graphics.text(
        transform.x,
        transform.y + offsetY + 10 + i * lineHeight,
        line,
        { fill: colors.textColor, fontSize: 12 }
      );
    });

    if (SHOW_PARTY_LINES) this._renderPartyLines(game, transform);
  }

  _renderPartyLines(game, transform) {
    const party = this.entity.getComponent('party');
    if (!party?.isInParty()) return;

    for (const member of party.getMembers()) {
      if (member === this.entity) continue;
      const mt = member.getComponent('transform');
      if (!mt) continue;
      game.graphics.line(
        transform.x, transform.y,
        mt.x, mt.y,
        { stroke: colors.blue02, strokeWidth: 4, strokeScaleWithZoom: false }
      );
    }
  }
}
