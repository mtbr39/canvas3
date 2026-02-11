import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Movement } from '../components/Movement.js';
import { Behavior } from '../components/Behavior.js';
import { IdleState } from '../states/IdleState.js';
import { CircleRenderer } from '../components/CircleRenderer.js';

export function createAnimal(x, y) {
  const entity = new Entity();

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('movement', new Movement(120))
    .addComponent('behavior', new Behavior(new IdleState()))
    .addComponent('circleRenderer', new CircleRenderer(15, { stroke: '#333333', strokeWidth: 1 }));

  return entity;
}
