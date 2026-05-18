// ============================================================
// InfoRenderer
//   ユニットの周囲に「視覚的な情報」だけを描く。文字や数字は出さない（→ EntityInfoPanel）。
//   - 下: HP/栄養/気力のバー
//   - 上: 状態カテゴリを示す小さなバッジ（色と形）
// ============================================================

// ステート名 → バッジ色（null なら描画しない）
const STATE_BADGE = {
  CombatState:      { color: '#cc4444', shape: 'triangle' },
  EatState:         { color: '#ccbb44', shape: 'diamond'  },
  BuyState:         { color: '#88cccc', shape: 'square'   },
  SellState:        { color: '#88cccc', shape: 'square'   },
  HuntingState:     { color: '#cc8844', shape: 'triangle' },
  CollectItemState: { color: '#9999cc', shape: 'circle'   },
  ReviveState:      { color: '#cc88cc', shape: 'circle'   },
  DeadState:        { color: '#555555', shape: 'cross'    },
  PartyMoveToState: { color: '#6699cc', shape: 'circle'   },
  SoloMoveToState:  { color: '#6699cc', shape: 'circle'   },
  HomeState:        { color: '#77bb77', shape: 'square'   },
  IdleState:        null,
  WanderState:      null,
};

const ZOOM_VISIBILITY_THRESHOLD = 1.0;

export class InfoRenderer {
  constructor() {
    this.entity = null;
  }

  isCameraCloseEnough() {
    return this.entity.game.camera.zoom >= ZOOM_VISIBILITY_THRESHOLD;
  }

  isVisible() {
    return this.isCameraCloseEnough();
  }

  render() {
    if (!this.isVisible()) return;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    const offsetY = this._getEntityRadius();
    this._renderVitalBars(transform, offsetY);
    this._renderStateBadge(transform, offsetY);
  }

  _getEntityRadius() {
    const collider = this.entity.getComponent('collider');
    if (!collider) return 25;
    return collider.shape.type === 'circle'
      ? collider.shape.radius
      : collider.shape.height / 2;
  }

  // ---------- 下: バイタルバー ----------
  _renderVitalBars(transform, offsetY) {
    const bars = this._collectBars();
    if (bars.length === 0) return;

    const width = 44;
    let y = transform.y + offsetY + 10;
    for (const bar of bars) {
      this._renderBar(transform.x, y, width, bar.height, bar.ratio, bar.color);
      y += bar.height + 2;
    }
  }

  _collectBars() {
    const bars = [];
    const health = this.entity.getComponent('health');
    if (health) {
      bars.push({
        ratio: this._ratio(health.currentHealth, health.maxHealth),
        color: '#cc4444',
        height: 5,
      });
    }
    const nutrition = this.entity.getComponent('nutrition');
    if (nutrition) bars.push({ ratio: nutrition.ratio, color: '#ccbb44', height: 3 });
    const vitality = this.entity.getComponent('vitality');
    if (vitality) bars.push({ ratio: vitality.ratio, color: '#6699cc', height: 3 });
    return bars;
  }

  _renderBar(cx, cy, width, height, ratio, color) {
    const game = this.entity.game;
    ratio = Math.max(0, Math.min(1, ratio));
    game.graphics.rect(cx, cy, width, height, { fill: 'rgba(0,0,0,0.35)' });
    if (ratio > 0) {
      const fillWidth = width * ratio;
      const fillX = cx - width / 2 + fillWidth / 2;
      game.graphics.rect(fillX, cy, fillWidth, height, { fill: color });
    }
  }

  // ---------- 上: 状態バッジ ----------
  _renderStateBadge(transform, offsetY) {
    const badge = this._currentBadge();
    if (!badge) return;

    const game = this.entity.game;
    const x = transform.x;
    const y = transform.y - offsetY - 14;
    const size = 6;

    this._renderShape(game, x, y, size, badge);
  }

  _currentBadge() {
    const behavior = this.entity.getComponent('behavior');
    const state = behavior?.currentState;
    if (!state) return null;
    return STATE_BADGE[state.constructor.name] ?? null;
  }

  _renderShape(game, x, y, size, badge) {
    const { color, shape } = badge;
    switch (shape) {
      case 'triangle':
        game.graphics.triangle(x, y, size, { fill: color, rotation: -Math.PI / 2 });
        break;
      case 'diamond':
        game.graphics.triangle(x, y, size + 1, { fill: color, rotation: -Math.PI / 2 });
        game.graphics.triangle(x, y, size + 1, { fill: color, rotation:  Math.PI / 2 });
        break;
      case 'square':
        game.graphics.rect(x, y, size * 1.6, size * 1.6, { fill: color });
        break;
      case 'cross':
        game.graphics.line(x - size, y - size, x + size, y + size, { stroke: color, strokeWidth: 2 });
        game.graphics.line(x - size, y + size, x + size, y - size, { stroke: color, strokeWidth: 2 });
        break;
      case 'circle':
      default:
        game.graphics.circle(x, y, size * 0.7, { fill: color });
        break;
    }
  }

  _ratio(current, max) {
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, current / max));
  }
}
