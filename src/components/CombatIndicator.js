import { RANGE_TIERS } from '../data/Items.js';

export class CombatIndicator {
  constructor() {
    this.entity = null;
  }

  render() {
    const combat = this.entity.getComponent('combat');
    if (!combat?.windup) return;

    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    const w = combat.windup;
    const game = this.entity.game;
    const progress = w.duration > 0 ? 1 - (w.timer / w.duration) : 1;

    if (w.weapon.attackType === 'melee') {
      const dist = combat.getMeleeHitboxDistance(w.weapon);
      const cx = transform.x + w.dirX * dist;
      const cy = transform.y + w.dirY * dist;
      const r = w.weapon.hitbox.radius;

      game.graphics.circle(cx, cy, r, {
        stroke: 'rgba(220, 60, 60, 0.9)',
        strokeWidth: 2,
      });
      game.graphics.circle(cx, cy, r * progress, {
        fill: 'rgba(220, 60, 60, 0.25)',
      });
    } else if (w.weapon.attackType === 'ranged') {
      const range = RANGE_TIERS[w.weapon.projectile.range] * 1.0;
      const endX = transform.x + w.dirX * range;
      const endY = transform.y + w.dirY * range;
      game.graphics.line(transform.x, transform.y, endX, endY, {
        stroke: `rgba(220, 60, 60, ${0.3 + progress * 0.6})`,
        strokeWidth: 2,
      });
      game.graphics.circle(endX, endY, w.weapon.projectile.radius * 1.2, {
        stroke: 'rgba(220, 60, 60, 0.9)',
        strokeWidth: 2,
      });
    }
  }
}
