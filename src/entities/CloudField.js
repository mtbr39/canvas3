import { Entity } from '../core/Entity.js';
import { CloudField } from '../components/CloudField.js';

export function createCloudField() {
  const entity = new Entity();
  entity.addComponent('cloudField', new CloudField());
  return entity;
}
