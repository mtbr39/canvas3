import { Entity } from '../core/Entity.js';
import { TreeField } from '../components/TreeField.js';

export function createTreeField() {
  const entity = new Entity();
  entity.addComponent('treeField', new TreeField());
  return entity;
}
