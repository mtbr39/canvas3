import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Movement } from '../components/Movement.js';
import { Behavior } from '../components/Behavior.js';
import { Health } from '../components/Health.js';
import { Combat } from '../components/Combat.js';
import { Equipment } from '../components/Equipment.js';
import { IdleState } from '../states/IdleState.js';
import { MonsterAppearance } from '../components/MonsterAppearance.js';
import { Collider } from '../components/Collider.js';
import { Tag } from '../components/Tag.js';
import { InfoRenderer } from '../components/InfoRenderer.js';
import { FloatingText } from '../components/FloatingText.js';
import { Loot } from '../components/Loot.js';

export function createMonsterBase(x, y, { health, speed, radius, attack, detectionRange, appearance } = {}) {
  const entity = new Entity();

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('movement', new Movement(speed ?? 120))
    .addComponent('behavior', new Behavior(new IdleState()))
    .addComponent('health', new Health(health ?? 50))
    .addComponent('collider', new Collider({ type: 'circle', radius: radius ?? 15 }))
    .addComponent('appearance', appearance ?? new MonsterAppearance())
    .addComponent('tag', new Tag('monster'))
    .addComponent('infoRenderer', new InfoRenderer())
    .addComponent('floatingText', new FloatingText())
    .addComponent('equipment', new Equipment(attack ?? 'claw'))
    .addComponent('combat', Combat.createAggressive(detectionRange ?? 150))
    .addComponent('loot', new Loot());

  return entity;
}

export function createBoss(x, y) {
  return createMonsterBase(x, y, {
    health: 300,
    speed: 80,
    radius: 40,
    attack: 'boss_claw',
    detectionRange: 250,
    appearance: new MonsterAppearance({ hasWings: true }),
  });
}

export function createMonster(x, y) {
  const attacks = ['claw', 'bite'];
  const attack = attacks[Math.floor(Math.random() * attacks.length)];
  return createMonsterBase(x, y, { attack });
}
