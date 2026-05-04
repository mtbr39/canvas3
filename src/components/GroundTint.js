import { PerlinNoise } from '../core/PerlinNoise.js';
import { colors } from '../data/Colors.js';

export class GroundTint {
  constructor() {
    this.entity = null;

    // 配置範囲（外部から設定される）
    this.worldWidth = 0;
    this.worldHeight = 0;

    // タイル（粗いほど軽量、細かいほど滑らか）
    this.cellSize = 600;

    // 色のムラを生む2層のノイズ
    this.noiseScale = 0.0002;
    this.noise = new PerlinNoise(31);

    // ベースになる基調色（パレットから淡い〜濃い緑）
    this.colors = [
      colors.backgroundColor,// 最も淡い
      colors.green03,
      colors.green02,
      colors.green01, // 最も濃い
    ];

    // セル間の継ぎ目をぼかすためのオーバードロー
    this.overdraw = 4;

    this.tiles = null;
  }

  render() {
    if (!this.tiles) this._generateTiles();
    const graphics = this.entity.game.graphics;
    const size = this.cellSize + this.overdraw;

    for (const t of this.tiles) {
      graphics.rect(t.x, t.y, size, size, { fill: t.color });
    }
  }

  _pickColor(n) {
    // n は概ね -1..1 → 0..1 にして色配列にマップ
    const t = Math.max(0, Math.min(0.999, (n + 1) * 0.5));
    return this.colors[Math.floor(t * this.colors.length)];
  }

  _generateTiles() {
    const w = this.worldWidth;
    const h = this.worldHeight;
    const cs = this.cellSize;
    const nx = Math.ceil(w / cs);
    const ny = Math.ceil(h / cs);
    const x0 = -w / 2;
    const y0 = -h / 2;
    const tiles = [];

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const cx = x0 + (i + 0.5) * cs;
        const cy = y0 + (j + 0.5) * cs;
        const n = this.noise.noise(cx * this.noiseScale, cy * this.noiseScale);
        tiles.push({ x: cx, y: cy, color: this._pickColor(n) });
      }
    }

    this.tiles = tiles;
  }
}
