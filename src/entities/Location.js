import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Collider } from '../components/Collider.js';
import { Tag } from '../components/Tag.js';
import { ShapeRenderer } from '../components/ShapeRenderer.js';
import { LocationLabel } from '../components/LocationLabel.js';

export function createLocation(x, y, type, name = '') {
  const entity = new Entity();

  const label = new LocationLabel();
  label.name = name;

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('collider', new Collider({ type: 'rect', width: 1000 + Math.random() * 1000, height: 1000 + Math.random() * 1000 }))
    .addComponent('tag', new Tag('location'))
    .addComponent('shapeRenderer', new ShapeRenderer({ stroke: '#000000', strokeWidth: 1 }))
    .addComponent('locationLabel', label);

  return entity;
}
