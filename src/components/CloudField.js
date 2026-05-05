import { PerlinNoise } from '../core/PerlinNoise.js';

export class CloudField {
  constructor() {
    this.entity = null;

    // 配置範囲（外部から設定される）
    this.worldWidth = 0;
    this.worldHeight = 0;

    // クラスタ配置（Perlinノイズで「雲が出る場所」を決める）
    this.clusterCellSize = 4000;
    this.clusterNoiseScale = 0.0008;
    this.clusterThreshold = 0.05;
    this.clusterNoise = new PerlinNoise(173);

    // 1雲あたりの円（puff）の数
    this.puffCountMin = 5;
    this.puffCountMax = 9;

    // 雲全体のサイズ
    this.cloudRadiusMin = 500;
    this.cloudRadiusMax = 1200;

    // 各puffの半径（雲半径に対する比率）
    this.puffRadiusFactorMin = 0.45;
    this.puffRadiusFactorMax = 0.85;

    // 配置時の最小距離（雲同士が重ならないように）
    this.minGapFactor = 1.1;

    // 色
    this.cloudColor = 'rgba(255, 255, 255, 0.4)';
    this.shadowColor = 'rgba(40, 50, 70, 0.2)';

    // 高度を表す影オフセット（大きいほど高く見える）
    this.shadowOffsetX = 400;
    this.shadowOffsetY = 300;

    // 流れる速度（右→左、少し左下方向）。基準値に対して雲ごとにランダムに±幅で揺らす
    this.velocityX = -100;
    this.velocityY = 12;
    this.velocityVariance = 0.5;  // 0で全雲同じ、1で基準速度の±100%まで揺らぐ

    // この値より拡大されたら雲本体は描画しない（影は常に描画）
    this.hideBodyZoomThreshold = 0.2;

    this.clouds = null;
  }

  update() {
    if (!this.clouds) return;
    const dt = this.entity.game.deltaTime;
    const w = this.worldWidth;
    const h = this.worldHeight;
    const halfW = w / 2;
    const halfH = h / 2;
    for (const c of this.clouds) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      // 端に出たら反対側に回り込ませる
      if (c.x < -halfW - c.radius) c.x += w + c.radius * 2;
      else if (c.x > halfW + c.radius) c.x -= w + c.radius * 2;
      if (c.y < -halfH - c.radius) c.y += h + c.radius * 2;
      else if (c.y > halfH + c.radius) c.y -= h + c.radius * 2;
    }
  }

  isBodyVisible() {
    return this.entity.game.camera.zoom < this.hideBodyZoomThreshold;
  }

  render() {
    if (!this.clouds) this._generateClouds();
    const graphics = this.entity.game.graphics;

    // 影を先にまとめて描く（雲ごとに1パスで union 塗り）
    for (const c of this.clouds) {
      const circles = c.puffs.map(p => ({
        x: c.x + p.dx + this.shadowOffsetX,
        y: c.y + p.dy + this.shadowOffsetY,
        r: p.r,
      }));
      graphics.circleUnion(circles, { fill: this.shadowColor });
    }

    // 雲本体（ズームインしすぎたら隠す）
    if (!this.isBodyVisible()) return;
    for (const c of this.clouds) {
      const circles = c.puffs.map(p => ({ x: c.x + p.dx, y: c.y + p.dy, r: p.r }));
      graphics.circleUnion(circles, { fill: this.cloudColor });
    }
  }

  _pickCloudRadius() {
    return this.cloudRadiusMin + Math.random() * (this.cloudRadiusMax - this.cloudRadiusMin);
  }

  _makePuffs(radius) {
    const n = this.puffCountMin + Math.floor(Math.random() * (this.puffCountMax - this.puffCountMin + 1));
    const puffs = [];
    for (let i = 0; i < n; i++) {
      // 横長の楕円状に配置（雲っぽく）
      const t = (i / Math.max(1, n - 1)) * 2 - 1; // -1..1
      const dx = t * radius * 0.7 + (Math.random() - 0.5) * radius * 0.3;
      const dy = (Math.random() - 0.5) * radius * 0.35;
      const factor = this.puffRadiusFactorMin
        + Math.random() * (this.puffRadiusFactorMax - this.puffRadiusFactorMin);
      puffs.push({ dx, dy, r: radius * factor });
    }
    return puffs;
  }

  _tooClose(x, y, radius, placed) {
    for (const c of placed) {
      const minDist = (c.radius + radius) * this.minGapFactor;
      const dx = c.x - x;
      const dy = c.y - y;
      if (dx * dx + dy * dy < minDist * minDist) return true;
    }
    return false;
  }

  _generateClouds() {
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
        const cx = x0 + (i + 0.5) * cs + (Math.random() - 0.5) * cs * 0.8;
        const cy = y0 + (j + 0.5) * cs + (Math.random() - 0.5) * cs * 0.8;
        const n = this.clusterNoise.noise(cx * this.clusterNoiseScale, cy * this.clusterNoiseScale);
        if (n < this.clusterThreshold) continue;

        const radius = this._pickCloudRadius();
        if (this._tooClose(cx, cy, radius, placed)) continue;

        const vJitterX = 1 + (Math.random() * 2 - 1) * this.velocityVariance;
        const vJitterY = 1 + (Math.random() * 2 - 1) * this.velocityVariance;
        placed.push({
          x: cx,
          y: cy,
          radius,
          puffs: this._makePuffs(radius),
          vx: this.velocityX * vJitterX,
          vy: this.velocityY * vJitterY,
        });
      }
    }

    this.clouds = placed;
  }
}
