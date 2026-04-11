import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Collider } from '../components/Collider.js';
import { Tag } from '../components/Tag.js';
import { ShapeRenderer } from '../components/ShapeRenderer.js';

export function createMountain(x, y, size) {
  const entity = new Entity();

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('collider', new Collider({ type: 'rect', width: size, height: size }))
    .addComponent('tag', new Tag('mountain').add('impassable'))
    .addComponent('shapeRenderer', new ShapeRenderer({ fill: '#6b4c2a', stroke: '#4a3018', strokeWidth: 2 }));

  return entity;
}
