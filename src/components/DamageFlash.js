export class DamageFlash {
  constructor() {
    this.entity = null;
    this.duration = 0.5;
    this.timer = this.duration;
  }

  update() {
    const game = this.entity.game;
    this.timer -= game.deltaTime;

    const shapeRenderer = this.entity.getComponent('shapeRenderer');
    if (shapeRenderer && this.timer > 0 && !shapeRenderer.flashTimer) {
      shapeRenderer.flash(this.duration);
    }

    if (this.timer <= 0) {
      this.entity.removeComponent('damageFlash');
    }
  }
}
