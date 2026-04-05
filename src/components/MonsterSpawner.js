import { createMonster } from '../entities/Monster.js';
import { PulseEffect } from './PulseEffect.js';

const MAX_MONSTERS = 30;
const SPAWN_COUNT = 5;

export class MonsterSpawner {
  constructor() {
    this.game = null;
    this.spawnInterval = 5; // seconds
    this.timer = 0;
  }

  update() {
    this.timer -= this.game.deltaTime;
    if (this.timer > 0) return;
    this.timer = this.spawnInterval;

    const current = this.game.entities.filter(e =>
      e.getComponent('tag')?.hasTag('monster')
    ).length;
    if (current >= MAX_MONSTERS) return;

    const count = Math.min(SPAWN_COUNT, MAX_MONSTERS - current);
    for (let i = 0; i < count; i++) {
      const pos = this._findSpawnPosition();
      const monster = createMonster(pos.x, pos.y);
      const pulse = new PulseEffect();
      monster.addComponent('pulseEffect', pulse);
      pulse.show();
      this.game.addEntity(monster);
    }
  }

  _findSpawnPosition() {
    const W = 8000;
    const H = 4000;
    for (let i = 0; i < 10; i++) {
      const x = (Math.random() - 0.5) * W;
      const y = (Math.random() - 0.5) * H;
      if (!this._isNearVillage(x, y)) return { x, y };
    }
    return { x: (Math.random() - 0.5) * W, y: (Math.random() - 0.5) * H };
  }

  _isNearVillage(x, y) {
    for (const entity of this.game.entities) {
      const tag = entity.getComponent('tag');
      if (!tag?.hasTag('village')) continue;
      const t = entity.getComponent('transform');
      const c = entity.getComponent('collider');
      if (!t || !c) continue;
      const margin = 500;
      const hw = c.shape.width / 2 + margin;
      const hh = c.shape.height / 2 + margin;
      if (Math.abs(x - t.x) < hw && Math.abs(y - t.y) < hh) return true;
    }
    return false;
  }
}
