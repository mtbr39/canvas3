import { PerlinNoise } from '../core/PerlinNoise.js';
import { colors } from '../data/Colors.js';

export class TreeField {
  constructor() {
    this.entity = null;

    // 配置範囲（外部から設定される）
    this.worldWidth = 0;
    this.worldHeight = 0;

    // 配置（2層のPerlin: 大きな「森らしさ」マップ × 小さな「局所のムラ」）
    this.cellSize = 70;
    this.maxDensity = 0.3;            // 最も濃い場所での配置確率の上限

    // マクロ: ワールドのどこが森に向いているかを決める（数個の大きな塊）
    this.macroScale = 0.00025;       // ごく小さい値で巨大なパターン
    this.macroThreshold = 0.01;      // これ未満のマクロ値は完全に開けた場所
    this.macroNoise = new PerlinNoise(12);

    // マイクロ: 森の中の細かな密度ムラ
    this.microScale = 0.0025;
    this.microThreshold = 0.05;
    this.microNoise = new PerlinNoise(73);

    // 外部から「ここは木が多い」マップを差し込めるようにする
    // (x, y) => 値（おおむね -1..1）。設定されると macroNoise の代わりに使う
    this.biomeSampler = null;

    // 木のサイズ（葉の半径）
    this.sizeMin = 32;
    this.sizeMax = 60;

    // 色（パレットの濃い緑）
    this.foliageColors = [colors.green04, colors.green05, colors.green02];
    this.shadowColor = 'rgba(30, 50, 30, 0.30)';
    this.shadowOffset = 8;

    this.trees = null;
  }

  render() {
    if (!this.trees) this._generateTrees();
    const graphics = this.entity.game.graphics;

    for (const t of this.trees) {
      graphics.circle(t.x + this.shadowOffset, t.y + this.shadowOffset, t.radius, {
        fill: this.shadowColor,
      });
    }

    for (const t of this.trees) {
      graphics.circle(t.x, t.y, t.radius, { fill: t.color });
    }
  }

  _generateTrees() {
    const w = this.worldWidth;
    const h = this.worldHeight;
    const cs = this.cellSize;
    const nx = Math.ceil(w / cs);
    const ny = Math.ceil(h / cs);
    const x0 = -w / 2;
    const y0 = -h / 2;
    const trees = [];

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const cx = x0 + (i + 0.5) * cs + (Math.random() - 0.5) * cs;
        const cy = y0 + (j + 0.5) * cs + (Math.random() - 0.5) * cs;

        // マクロ: ここが森エリアかどうか（広い範囲で1か0に近い）
        const macro = this.biomeSampler
          ? this.biomeSampler(cx, cy)
          : this.macroNoise.noise(cx * this.macroScale, cy * this.macroScale);
        if (macro < this.macroThreshold) continue;
        const macroFactor = Math.min(1, (macro - this.macroThreshold) / 0.4);

        // マイクロ: 森の中の細かいムラ
        const micro = this.microNoise.noise(cx * this.microScale, cy * this.microScale);
        if (micro < this.microThreshold) continue;
        const microFactor = Math.min(1, (micro - this.microThreshold) / 0.5);

        const density = macroFactor * microFactor * this.maxDensity;
        if (Math.random() > density) continue;

        const radius = this.sizeMin + Math.random() * (this.sizeMax - this.sizeMin);
        const color = this.foliageColors[Math.floor(Math.random() * this.foliageColors.length)];
        trees.push({ x: cx, y: cy, radius, color });
      }
    }

    trees.sort((a, b) => a.y - b.y);
    this.trees = trees;
  }
}
