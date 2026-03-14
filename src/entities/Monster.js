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

export function createMonster(x, y) {
  const entity = new Entity();

  const attacks = ['claw', 'bite'];
  const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('movement', new Movement(120))
    .addComponent('behavior', new Behavior(new IdleState()))
    .addComponent('health', new Health(50))
    .addComponent('collider', new Collider({ type: 'circle', radius: 15 }))
    .addComponent('monsterAppearance', new MonsterAppearance())
    .addComponent('tag', new Tag('monster'))
    .addComponent('infoRenderer', new InfoRenderer())
    .addComponent('floatingText', new FloatingText())
    .addComponent('equipment', new Equipment(randomAttack))
    .addComponent('combat', Combat.createAggressive());

  return entity;
}
