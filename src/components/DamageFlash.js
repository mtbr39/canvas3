export class DamageFlash {
  constructor() {
    this.entity = null;
    this.duration = 0.5;
    this.timer = this.duration;
  }

  update() {
    const game = this.entity.game;
    this.timer -= game.deltaTime;

    const renderer = this.entity.getComponent('shapeRenderer') || this.entity.getComponent('appearance');
    if (renderer && this.timer > 0 && !renderer.flashTimer) {
      renderer.flash(this.duration);
    }

    if (this.timer <= 0) {
      this.entity.removeComponent('damageFlash');
    }
  }
}
