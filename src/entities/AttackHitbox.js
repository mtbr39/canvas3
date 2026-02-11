import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Collider } from '../components/Collider.js';
import { Tag } from '../components/Tag.js';
import { AttackHitbox } from '../components/AttackHitbox.js';
import { ShapeRenderer } from '../components/ShapeRenderer.js';

export function createAttackHitbox(x, y, radius, damage, ownerEntity, duration = 0.2) {
  const entity = new Entity();

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('collider', new Collider({ type: 'circle', radius }))
    .addComponent('tag', new Tag('attack'))
    .addComponent('attackHitbox', new AttackHitbox(damage, ownerEntity, duration))
    .addComponent('shapeRenderer', new ShapeRenderer({
      fill: 'rgba(255, 0, 0, 0.1)',
      stroke: '#ff0000',
      strokeWidth: 1
    }));

  return entity;
}
