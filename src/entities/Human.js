import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Movement } from '../components/Movement.js';
import { Behavior } from '../components/Behavior.js';
import { Health } from '../components/Health.js';
import { Combat } from '../components/Combat.js';
import { IdleState } from '../states/IdleState.js';
import { CircleRenderer } from '../components/CircleRenderer.js';
import { Tag } from '../components/Tag.js';

export function createHuman(x, y) {
  const entity = new Entity();

  // 50% adventurer, 50% villager
  const isAdventurer = Math.random() < 0.5;

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('movement', new Movement(50))
    .addComponent('behavior', new Behavior(new IdleState()))
    .addComponent('health', new Health(100))
    .addComponent('circleRenderer', new CircleRenderer(25, {
      stroke: isAdventurer ? '#ff0000' : '#333333', // Red for adventurers
      strokeWidth: 1
    }))
    .addComponent('tag', new Tag('human'));

  // Only adventurers get combat component
  if (isAdventurer) {
    entity.addComponent('combat', new Combat('adventurer', 10, 250, 1.0));
  }

  return entity;
}
