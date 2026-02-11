export class DamageFlash {
  constructor() {
    this.entity = null;
    this.duration = 0.5;
    this.timer = this.duration;
  }

  update() {
    const game = this.entity.game;
    this.timer -= game.deltaTime;

    const circleRenderer = this.entity.getComponent('circleRenderer');
    if (circleRenderer && this.timer > 0 && !circleRenderer.flashTimer) {
      circleRenderer.flash(this.duration);
    }

    if (this.timer <= 0) {
      this.entity.removeComponent('damageFlash');
    }
  }
}
