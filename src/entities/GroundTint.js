import { Entity } from '../core/Entity.js';
import { GroundTint } from '../components/GroundTint.js';

export function createGroundTint() {
  const entity = new Entity();
  entity.addComponent('groundTint', new GroundTint());
  return entity;
}
