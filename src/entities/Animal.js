import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Movement } from '../components/Movement.js';
import { CircleRenderer } from '../components/CircleRenderer.js';

export function createAnimal(x, y) {
  const entity = new Entity();

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('movement', new Movement(120))
    .addComponent('circleRenderer', new CircleRenderer(15, '#50c878'));

  return entity;
}
