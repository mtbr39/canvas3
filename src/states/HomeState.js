export class HomeState {
  constructor() {
    this._phase = null;
    this._timer = 0;
  }

  enter(entity) {
    this._nextAction(entity);
  }

  update(entity) {
    if (this._phase === 'idle') {
      this._timer -= entity.game.deltaTime;
      if (this._timer <= 0) this._nextAction(entity);
    } else if (this._phase === 'wandering') {
      const movement = entity.getComponent('movement');
      if (movement?.hasArrived()) this._nextAction(entity);
    }
  }

  _nextAction(entity) {
    if (Math.random() < 0.5) {
      this._phase = 'idle';
      this._timer = 1 + Math.random() * 3;
      entity.getComponent('movement')?.stop();
    } else {
      this._phase = 'wandering';
      const pos = this._randomPointInHome(entity);
      entity.getComponent('movement')?.moveTo(pos.x, pos.y);
    }
  }

  _randomPointInHome(entity) {
    const home = entity.getComponent('resident').home;
    const t = home.getComponent('transform');
    const c = home.getComponent('collider');
    const hw = c.shape.width / 2 * 0.8;
    const hh = c.shape.height / 2 * 0.8;
    return {
      x: t.x + (Math.random() - 0.5) * hw * 2,
      y: t.y + (Math.random() - 0.5) * hh * 2,
    };
  }
}
