export class SpatialQuery {
  constructor(game) {
    this.game = game;
  }

  getDistance(entity1, entity2) {
    const t1 = entity1.getComponent('transform');
    const t2 = entity2.getComponent('transform');
    if (!t1 || !t2) return Infinity;

    const dx = t2.x - t1.x;
    const dy = t2.y - t1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getCollisionDistance(entity1, entity2) {
    const t1 = entity1.getComponent('transform');
    const t2 = entity2.getComponent('transform');
    if (!t1 || !t2) return Infinity;

    const c1 = entity1.getComponent('collider');
    const c2 = entity2.getComponent('collider');

    if (!c1 && !c2) {
      return this.getDistance(entity1, entity2);
    }

    const type1 = c1?.shape.type || 'point';
    const type2 = c2?.shape.type || 'point';

    if (type1 === 'circle' && type2 === 'circle') {
      return this.circleToCircle(t1, c1, t2, c2);
    } else if (type1 === 'rect' && type2 === 'rect') {
      return this.rectToRect(t1, c1, t2, c2);
    } else if (type1 === 'circle' && type2 === 'rect') {
      return this.circleToRect(t1, c1, t2, c2);
    } else if (type1 === 'rect' && type2 === 'circle') {
      return this.circleToRect(t2, c2, t1, c1);
    }

    return this.getDistance(entity1, entity2);
  }

  circleToCircle(t1, c1, t2, c2) {
    const dx = t2.x - t1.x;
    const dy = t2.y - t1.y;
    const centerDistance = Math.sqrt(dx * dx + dy * dy);
    return centerDistance - c1.shape.radius - c2.shape.radius;
  }

  rectToRect(t1, c1, t2, c2) {
    const half1W = c1.shape.width / 2;
    const half1H = c1.shape.height / 2;
    const half2W = c2.shape.width / 2;
    const half2H = c2.shape.height / 2;

    const left1 = t1.x - half1W;
    const right1 = t1.x + half1W;
    const top1 = t1.y - half1H;
    const bottom1 = t1.y + half1H;

    const left2 = t2.x - half2W;
    const right2 = t2.x + half2W;
    const top2 = t2.y - half2H;
    const bottom2 = t2.y + half2H;

    const dx = Math.max(left1 - right2, 0, left2 - right1);
    const dy = Math.max(top1 - bottom2, 0, top2 - bottom1);

    return Math.sqrt(dx * dx + dy * dy);
  }

  circleToRect(tCircle, cCircle, tRect, cRect) {
    const halfW = cRect.shape.width / 2;
    const halfH = cRect.shape.height / 2;

    const rectLeft = tRect.x - halfW;
    const rectRight = tRect.x + halfW;
    const rectTop = tRect.y - halfH;
    const rectBottom = tRect.y + halfH;

    const closestX = Math.max(rectLeft, Math.min(tCircle.x, rectRight));
    const closestY = Math.max(rectTop, Math.min(tCircle.y, rectBottom));

    const dx = tCircle.x - closestX;
    const dy = tCircle.y - closestY;
    const pointDistance = Math.sqrt(dx * dx + dy * dy);

    return pointDistance - cCircle.shape.radius;
  }

  findNearbyEntities(entities, centerX, centerY, radius, filterFn = null) {
    const nearby = [];
    for (const entity of entities) {
      const transform = entity.getComponent('transform');
      if (!transform) continue;
      const dx = transform.x - centerX;
      const dy = transform.y - centerY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radius * radius) {
        if (!filterFn || filterFn(entity)) {
          nearby.push({ entity, distance: Math.sqrt(distSq) });
        }
      }
    }
    nearby.sort((a, b) => a.distance - b.distance);
    return nearby;
  }

  findNearbyByTag(entities, centerX, centerY, radius, tag) {
    return this.findNearbyEntities(entities, centerX, centerY, radius, (entity) => {
      const tagComp = entity.getComponent('tag');
      return tagComp && tagComp.tag === tag;
    });
  }

  findCollidingEntities(sourceEntity, filterFn = null) {
    const colliding = [];
    for (const target of this.game.entities) {
      if (target === sourceEntity) continue;
      if (filterFn && !filterFn(target)) continue;

      const distance = this.getCollisionDistance(sourceEntity, target);
      if (distance <= 0) {
        colliding.push(target);
      }
    }
    return colliding;
  }
}
