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
    this.noiseScale = 0.0004; // ノイズの縮尺（小さいほど模様が大きい）
    this.noise = new PerlinNoise(31);

    // ベースになる基調色：最も淡い色から、暗さと彩度を段階的に上げて生成
    const lightest = this._lighten(colors.green03, 0.5);
    this.colors = [
      lightest,                                // 最も淡い
      this._step(lightest, 0.06, 0.01),
      this._step(lightest, 0.10, 0.02),
      this._step(lightest, 0.12, 0.03),       // 最も濃い
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

  _lighten(hex, amount) {
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (!m) return hex;
    const v = parseInt(m[1], 16);
    let r = (v >> 16) & 0xff;
    let g = (v >> 8) & 0xff;
    let b = v & 0xff;
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // 明度を darkAmount だけ下げ、彩度を satAmount だけ上げる
  _step(hex, darkAmount, satAmount) {
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (!m) return hex;
    const v = parseInt(m[1], 16);
    const r = ((v >> 16) & 0xff) / 255;
    const g = ((v >> 8) & 0xff) / 255;
    const b = (v & 0xff) / 255;
    const [h, s, l] = this._rgbToHsl(r, g, b);
    const nl = Math.max(0, Math.min(1, l - darkAmount));
    const ns = Math.max(0, Math.min(1, s + satAmount));
    const [nr, ng, nb] = this._hslToRgb(h, ns, nl);
    const ri = Math.round(nr * 255);
    const gi = Math.round(ng * 255);
    const bi = Math.round(nb * 255);
    return '#' + ((ri << 16) | (gi << 8) | bi).toString(16).padStart(6, '0');
  }

  _rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  _hslToRgb(h, s, l) {
    if (s === 0) return [l, l, l];
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
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
