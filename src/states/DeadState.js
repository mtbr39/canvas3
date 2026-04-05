import { colors } from '../data/Colors.js';

const SHOW_DEAD_COLOR = true;

export class DeadState {
  enter(entity) {
    entity.getComponent('movement')?.stop();
    const shapeRenderer = entity.getComponent('shapeRenderer');
    if (SHOW_DEAD_COLOR && shapeRenderer) {
      this._originalFill = shapeRenderer.options.fill;
      shapeRenderer.options.fill = colors.red01;
    }
  }

  update(_entity) {}

  exit(entity) {
    const shapeRenderer = entity.getComponent('shapeRenderer');
    if (SHOW_DEAD_COLOR && shapeRenderer && this._originalFill !== undefined) {
      shapeRenderer.options.fill = this._originalFill;
    }
  }
}
