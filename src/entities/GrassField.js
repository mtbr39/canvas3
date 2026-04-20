import { Entity } from '../core/Entity.js';
import { GrassField } from '../components/GrassField.js';

export function createGrassField() {
  const entity = new Entity();
  entity.addComponent('grassField', new GrassField());
  return entity;
}
