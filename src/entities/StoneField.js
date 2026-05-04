import { Entity } from '../core/Entity.js';
import { StoneField } from '../components/StoneField.js';

export function createStoneField() {
  const entity = new Entity();
  entity.addComponent('stoneField', new StoneField());
  return entity;
}
