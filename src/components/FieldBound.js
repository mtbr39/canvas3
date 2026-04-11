export class FieldBound {
  constructor() {
    this.entity = null;
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.hw = 0;
    this.hh = 0;
  }

  setBounds(x, y, hw, hh) {
    this.x = x;
    this.y = y;
    this.hw = hw;
    this.hh = hh;
    this.active = true;
  }

  update() {
    if (!this.active) return;
    const transform = this.entity.getComponent('transform');
    const movement = this.entity.getComponent('movement');
    if (!transform || !movement) return;

    this._clampPosition(transform);

    if (movement.moving) {
      this._reflectTarget(transform, movement);
    }
  }

  _clampPosition(transform) {
    const minX = this.x - this.hw;
    const maxX = this.x + this.hw;
    const minY = this.y - this.hh;
    const maxY = this.y + this.hh;
    transform.x = Math.max(minX, Math.min(maxX, transform.x));
    transform.y = Math.max(minY, Math.min(maxY, transform.y));
  }

  _reflectTarget(transform, movement) {
    const minX = this.x - this.hw;
    const maxX = this.x + this.hw;
    const minY = this.y - this.hh;
    const maxY = this.y + this.hh;

    if (movement.targetX < minX) movement.targetX = 2 * minX - movement.targetX;
    if (movement.targetX > maxX) movement.targetX = 2 * maxX - movement.targetX;
    if (movement.targetY < minY) movement.targetY = 2 * minY - movement.targetY;
    if (movement.targetY > maxY) movement.targetY = 2 * maxY - movement.targetY;

    movement.targetX = Math.max(minX, Math.min(maxX, movement.targetX));
    movement.targetY = Math.max(minY, Math.min(maxY, movement.targetY));
  }
}
