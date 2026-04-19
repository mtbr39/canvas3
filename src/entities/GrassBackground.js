import { Entity } from '../core/Entity.js';
import { GrassBackground } from '../components/GrassBackground.js';

export function createGrassBackground() {
  const entity = new Entity();
  entity.addComponent('grassBackground', new GrassBackground());
  return entity;
}
