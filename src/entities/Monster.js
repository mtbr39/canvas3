import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Movement } from '../components/Movement.js';
import { Behavior } from '../components/Behavior.js';
import { Health } from '../components/Health.js';
import { Combat } from '../components/Combat.js';
import { CombatIndicator } from '../components/CombatIndicator.js';
import { AfterImage } from '../components/AfterImage.js';
import { Equipment } from '../components/Equipment.js';
import { IdleState } from '../states/IdleState.js';
import { MonsterAppearance } from '../components/MonsterAppearance.js';
import { Collider } from '../components/Collider.js';
import { Tag } from '../components/Tag.js';
import { Relationship } from '../components/Relationship.js';
import { InfoRenderer } from '../components/InfoRenderer.js';
import { Loot } from '../components/Loot.js';
import { PulseEffect } from '../components/PulseEffect.js';
import { FieldBound } from '../components/FieldBound.js';

const MONSTER_STATS = {
  normal: {
    health: 100,
    speed: 120,
    radius: 15,
    attack: 'claw',
    detectionRange: 150,
    chaseRange: 1200,
    regenRate: 0,
  },
  boss: {
    health: 300,
    speed: 80,
    radius: 40,
    attack: 'boss_claw',
    detectionRange: 250,
    chaseRange: 1200,
    regenRate: 5,
  },
};

export function createMonsterBase(x, y, stats) {
  const entity = new Entity();

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('movement', new Movement(stats.speed))
    .addComponent('behavior', new Behavior(new IdleState()))
    .addComponent('health', new Health(stats.health, { regenRate: stats.regenRate }))
    .addComponent('collider', new Collider({ type: 'circle', radius: stats.radius }))
    .addComponent('appearance', stats.appearance ?? new MonsterAppearance())
    .addComponent('tag', new Tag('monster'))
    .addComponent('relationship', new Relationship())
    .addComponent('infoRenderer', new InfoRenderer())
    .addComponent('combatIndicator', new CombatIndicator())
    .addComponent('afterImage', new AfterImage())
    .addComponent('equipment', new Equipment(stats.attack))
    .addComponent('combat', Combat.createAggressive(stats.detectionRange, stats.chaseRange))
    .addComponent('loot', new Loot())
    .addComponent('pulseEffect', new PulseEffect())
    .addComponent('fieldBound', new FieldBound());

  return entity;
}

export function createBoss(x, y) {
  return createMonsterBase(x, y, {
    ...MONSTER_STATS.boss,
    appearance: new MonsterAppearance({ hasWings: true }),
  });
}

export function createMonster(x, y) {
  const attacks = ['claw', 'bite'];
  return createMonsterBase(x, y, {
    ...MONSTER_STATS.normal,
    attack: attacks[Math.floor(Math.random() * attacks.length)],
  });
}
