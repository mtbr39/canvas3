export class FollowOwner {
  constructor() {
    this.entity = null;
    this.owner = null;
    this.rowDistance = 0;
    this.colOffset = 0;
    this.followSpeed = 200;
  }

  setOwner(owner, rowDistance = 0, colOffset = 0) {
    this.owner = owner;
    this.rowDistance = rowDistance;
    this.colOffset = colOffset;
  }

  update() {
    if (!this.owner) return;

    const transform = this.entity.getComponent('transform');
    const ownerTransform = this.owner.getComponent('transform');
    if (!transform || !ownerTransform) return;

    const backDirection = ownerTransform.direction + Math.PI;
    const sideDirection = ownerTransform.direction + Math.PI / 2;

    const offsetX = Math.cos(backDirection) * this.rowDistance + Math.cos(sideDirection) * this.colOffset;
    const offsetY = Math.sin(backDirection) * this.rowDistance + Math.sin(sideDirection) * this.colOffset;

    const targetX = ownerTransform.x + offsetX;
    const targetY = ownerTransform.y + offsetY;

    const dx = targetX - transform.x;
    const dy = targetY - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) {
      transform.x = targetX;
      transform.y = targetY;
      return;
    }

    const game = this.entity.game;
    const step = this.followSpeed * game.deltaTime;

    if (distance <= step) {
      transform.x = targetX;
      transform.y = targetY;
    } else {
      transform.x += (dx / distance) * step;
      transform.y += (dy / distance) * step;
    }
  }
}
