import { createMonster } from '../entities/Monster.js';

export class FieldSpawner {
  constructor() {
    this.entity = null;
    this.maxMonsters = 10;
    this.spawnInterval = 8;
    this.timer = 0;
  }

  update() {
    this.timer -= this.entity.game.deltaTime;
    if (this.timer > 0) return;
    this.timer = this.spawnInterval;

    const bounds = this._getBounds();
    if (!bounds) return;

    const current = this._countMonstersInBounds(bounds);
    if (current >= this.maxMonsters) return;

    const count = this.maxMonsters - current;
    for (let i = 0; i < count; i++) {
      const pos = this._randomPositionInBounds(bounds);
      const monster = createMonster(pos.x, pos.y);
      monster.getComponent('pulseEffect').show();
      monster.getComponent('fieldBound').setBounds(bounds.x, bounds.y, bounds.hw, bounds.hh);
      this.entity.game.addEntity(monster);
    }
  }

  _getBounds() {
    const t = this.entity.getComponent('transform');
    const c = this.entity.getComponent('collider');
    if (!t || !c) return null;
    return {
      x: t.x,
      y: t.y,
      hw: c.shape.width / 2,
      hh: c.shape.height / 2,
    };
  }

  _countMonstersInBounds({ x, y, hw, hh }) {
    return this.entity.game.entities.filter(e => {
      if (!e.getComponent('tag')?.hasTag('monster')) return false;
      const t = e.getComponent('transform');
      if (!t) return false;
      return Math.abs(t.x - x) < hw && Math.abs(t.y - y) < hh;
    }).length;
  }

  _randomPositionInBounds({ x, y, hw, hh }) {
    return {
      x: x + (Math.random() * 2 - 1) * hw,
      y: y + (Math.random() * 2 - 1) * hh,
    };
  }
}
