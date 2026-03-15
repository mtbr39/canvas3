import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Collider } from '../components/Collider.js';
import { Tag } from '../components/Tag.js';
import { ShapeRenderer } from '../components/ShapeRenderer.js';
import { Inn } from '../components/Inn.js';
import { Shop } from '../components/Shop.js';
import Inventory from '../components/Inventory.js';
import { colors } from '../data/Colors.js';

export const BUILDING_CONFIGS = {
  inn: {
    width: 400,
    height: 300,
    stroke: colors.orange01,
    strokeWidth: 2,
  },
  shop: {
    width: 240,
    height: 180,
    stroke: colors.blue03,
    strokeWidth: 2,
  },
};

export function createBuilding(x, y, type) {
  const config = BUILDING_CONFIGS[type];
  if (!config) {
    console.error(`Unknown building type: ${type}`);
    return null;
  }

  const entity = new Entity();

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('collider', new Collider({ type: 'rect', width: config.width, height: config.height }))
    .addComponent('tag', new Tag('building').add(type))
    .addComponent('shapeRenderer', new ShapeRenderer({ stroke: config.stroke, strokeWidth: config.strokeWidth }));

  if (type === 'inn') {
    entity.addComponent('inn', new Inn());
  }

  if (type === 'shop') {
    entity.addComponent('inventory', new Inventory());
    entity.addComponent('shop', new Shop());
  }

  return entity;
}
