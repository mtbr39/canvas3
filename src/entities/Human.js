import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Movement } from '../components/Movement.js';
import { CircleRenderer } from '../components/CircleRenderer.js';

export function createHuman(x, y) {
  const entity = new Entity();

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('movement', new Movement(50))
    .addComponent('circleRenderer', new CircleRenderer(25, '#4a90d9'));

  return entity;
}
