import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Tag } from '../components/Tag.js';
import { RoadPath } from '../components/RoadPath.js';
import { RoadRenderer } from '../components/RoadRenderer.js';

export function createRoad(waypoints) {
  const entity = new Entity();
  const start = waypoints[0];

  entity
    .addComponent('transform', new Transform(start.x, start.y))
    .addComponent('tag', new Tag('road'))
    .addComponent('roadPath', new RoadPath(waypoints))
    .addComponent('roadRenderer', new RoadRenderer());

  return entity;
}
