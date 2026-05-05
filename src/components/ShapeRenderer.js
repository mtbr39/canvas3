export class ShapeRenderer {
  constructor(options = {}) {
    this.entity = null;
    this.options = options;
    this.visible = true;
    this.flashTimer = 0;
    this.flashSpeed = 10;

    // 影（建物などは shadow:false で無効化できる）
    this.shadow = options.shadow !== false;
    this.shadowColor = 'rgba(20, 25, 35, 0.3)';
    this.shadowOffsetFactorX = 0.40;
    this.shadowOffsetFactorY = 0.20;
  }

  flash(duration = 0.5) {
    this.flashTimer = duration;
  }

  update() {
    if (this.flashTimer > 0) {
      const game = this.entity.game;
      this.flashTimer -= game.deltaTime;

      const cycle = Math.floor(this.flashTimer * this.flashSpeed);
      this.visible = cycle % 2 === 0;

      if (this.flashTimer <= 0) {
        this.flashTimer = 0;
        this.visible = true;
      }
    }
  }

  render() {
    if (!this.visible) return;

    const game = this.entity.game;
    const transform = this.entity.getComponent('transform');
    const collider = this.entity.getComponent('collider');
    if (!transform || !collider) return;

    if (this.shadow) this._renderShadow(game, transform, collider);

    if (collider.shape.type === 'circle') {
      game.graphics.circle(
        transform.x,
        transform.y,
        collider.shape.radius,
        this.options
      );
    } else if (collider.shape.type === 'rect') {
      game.graphics.rect(
        transform.x,
        transform.y,
        collider.shape.width,
        collider.shape.height,
        this.options
      );
    }
  }

  _renderShadow(game, transform, collider) {
    const r = collider.shape.radius ?? Math.max(collider.shape.width, collider.shape.height) / 2;
    const ox = r * this.shadowOffsetFactorX;
    const oy = r * this.shadowOffsetFactorY;
    const opts = { fill: this.shadowColor };

    if (collider.shape.type === 'circle') {
      game.graphics.circle(transform.x + ox, transform.y + oy, collider.shape.radius, opts);
    } else if (collider.shape.type === 'rect') {
      game.graphics.rect(
        transform.x + ox,
        transform.y + oy,
        collider.shape.width,
        collider.shape.height,
        opts
      );
    }
  }
}
