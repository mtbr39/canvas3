import { PerlinNoise } from '../core/PerlinNoise.js';

export class StoneField {
  constructor() {
    this.entity = null;

    // 配置範囲（外部から設定される）
    this.worldWidth = 0;
    this.worldHeight = 0;

    // クラスタ配置（Perlinノイズで「石が集まる場所」を決める）
    this.clusterCellSize = 1400;       // クラスタ候補のグリッド間隔
    this.clusterNoiseScale = 0.02;  // ノイズ縮尺（小さいほど模様が大きい）
    this.clusterThreshold = 0.01;     // これ未満のセルはクラスタを作らない
    this.clusterNoise = new PerlinNoise(91);

    // 外部から「ここは石が多い」マップを差し込めるようにする
    // (x, y) => 値（おおむね -1..1）。設定されると clusterNoise の代わりに使う
    this.biomeSampler = null;

    // 各クラスタ内の石の数と広がり
    this.stonesPerClusterMin = 1;
    this.stonesPerClusterMax = 3;
    this.clusterRadius = 800;

    // サイズ範囲（最小〜最大の一様乱数）
    this.radiusMin = 26;
    this.radiusMax = 170;

    // 配置時の最小距離（Poisson-disk 風に近接抑制）
    this.minGapFactor = 1.15;  // 距離 >= (rA + rB) * factor を要求

    // 形状
    this.vertexCountMin = 6;
    this.vertexCountMax = 9;
    this.vertexJitter = 0.28;  // 半径に対するジッタ比率

    // 色（白〜淡灰のバリエーション）
    this.colors = ['#f2efe6', '#e8e3d4', '#dcd6c5', '#ebe6d8'];
    this.shadowColor = 'rgba(80, 80, 70, 0.18)';
    this.shadowOffset = 10;
    this.strokeColor = 'rgba(120, 115, 100, 0.35)';

    this.stones = null;
  }

  render() {
    if (!this.stones) this._generateStones();
    const graphics = this.entity.game.graphics;

    // 影を先にまとめて描く
    for (const s of this.stones) {
      graphics.polygon(s.x + this.shadowOffset, s.y + this.shadowOffset, s.vertices, {
        fill: this.shadowColor,
      });
    }

    for (const s of this.stones) {
      graphics.polygon(s.x, s.y, s.vertices, {
        fill: s.color,
        stroke: this.strokeColor,
        strokeWidth: 1,
      });
    }
  }

  _pickRadius() {
    return this.radiusMin + Math.random() * (this.radiusMax - this.radiusMin);
  }

  _makeVertices(radius) {
    const n = this.vertexCountMin + Math.floor(Math.random() * (this.vertexCountMax - this.vertexCountMin + 1));
    const angleOffset = Math.random() * Math.PI * 2;
    const verts = [];
    for (let i = 0; i < n; i++) {
      const a = angleOffset + (Math.PI * 2 * i) / n + (Math.random() - 0.5) * (Math.PI / n);
      const r = radius * (1 - this.vertexJitter * Math.random());
      verts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return verts;
  }

  _tooClose(x, y, radius, placed) {
    for (const s of placed) {
      const minDist = (s.radius + radius) * this.minGapFactor;
      const dx = s.x - x;
      const dy = s.y - y;
      if (dx * dx + dy * dy < minDist * minDist) return true;
    }
    return false;
  }

  _generateStones() {
    const w = this.worldWidth;
    const h = this.worldHeight;
    const cs = this.clusterCellSize;
    const nx = Math.ceil(w / cs);
    const ny = Math.ceil(h / cs);
    const x0 = -w / 2;
    const y0 = -h / 2;

    const placed = [];

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const cx = x0 + (i + 0.5) * cs + (Math.random() - 0.5) * cs * 0.6;
        const cy = y0 + (j + 0.5) * cs + (Math.random() - 0.5) * cs * 0.6;
        const n = this.biomeSampler
          ? this.biomeSampler(cx, cy)
          : this.clusterNoise.noise(cx * this.clusterNoiseScale, cy * this.clusterNoiseScale);
        if (n < this.clusterThreshold) continue;

        const density = Math.min(1, (n - this.clusterThreshold) / 0.5);
        const stoneCount = this.stonesPerClusterMin
          + Math.floor(density * (this.stonesPerClusterMax - this.stonesPerClusterMin + 1));

        // クラスタの中心石
        const centerR = this._pickRadius();
        if (!this._tooClose(cx, cy, centerR, placed)) {
          placed.push({
            x: cx, y: cy, radius: centerR,
            vertices: this._makeVertices(centerR),
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
          });
        }

        // 周辺の石
        for (let k = 0; k < stoneCount - 1; k++) {
          const radius = this._pickRadius();
          let placedOne = false;
          for (let attempt = 0; attempt < 8; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = (0.4 + Math.random() * 0.6) * this.clusterRadius;
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist;
            if (!this._tooClose(x, y, radius, placed)) {
              placed.push({
                x, y, radius,
                vertices: this._makeVertices(radius),
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
              });
              placedOne = true;
              break;
            }
          }
        }
      }
    }

    this.stones = placed;
  }
}
