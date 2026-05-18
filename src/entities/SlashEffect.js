import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { SlashEffect } from '../components/SlashEffect.js';

export function createSlashEffect(originX, originY, dirX, dirY, swingRadius) {
  const entity = new Entity();
  const slash = new SlashEffect();

  entity
    .addComponent('transform', new Transform(originX, originY))
    .addComponent('slashEffect', slash);

  slash.show({ dirX, dirY, originX, originY, swingRadius });
  return entity;
}
