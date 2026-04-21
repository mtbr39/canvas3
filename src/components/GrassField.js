import { PerlinNoise } from '../core/PerlinNoise.js';
import { colors } from '../data/Colors.js';

export class GrassField {
  constructor() {
    this.entity = null;
    this.time = 0;

    // 配置範囲
    this.worldWidth = 8000;
    this.worldHeight = 4000;

    // 配置（Perlinノイズでクラスタ状に）
    this.cellSize = 120;             // グリッド間隔（小さいほど密）
    this.maxPerCell = 3;             // ノイズ最大のセルでの配置数
    this.placementScale = 0.001;     // ノイズ縮尺（小さいほど模様が大きい）
    this.placementThreshold = 0.0;   // これ未満のセルは草を生やさない
    this.placementNoise = new PerlinNoise(17);

    // 三角形
    this.size = 18;
    this.color = colors.green03;
    this.rotationRandomness = 0.04;   // 0 = 全部とんがりが真上、1 = 完全ランダム

    // 揺れ（左から右へ進む波）
    //   位相 = k*x - ω*t   →  phase-constant line は x = (ω/k)*t で右へ移動
    this.swayAmplitude = 0.5;       // 最大回転量（ラジアン）
    this.swayTimeFreq = 3.0;         // ω
    this.swaySpaceFreq = 0.004;        // k = 空間周波数（波長 = 2π/k、位相速度 = ω/k）

    // 揺れの包絡（波が始まる場所・終わる場所を決める気流のパケット）
    this.envelopeScale = 0.0008;     // パケットの大きさ（小さいほど巨大）
    this.envelopeSpeed = 200;        // パケットが左→右へ流れる速さ
    this.envelopeThreshold = -0.01;  // 風域の割合（下げると同時に波が起きる場所が増える）
    this.envelopeSharpness = 3.0;    // 包絡の立ち上がりの鋭さ
    this.envelopeNoise = new PerlinNoise(53);

    this.blades = null;
  }

  update() {
    this.time += this.entity.game.deltaTime;
  }

  render() {
    if (!this.blades) this._generateBlades();

    const graphics = this.entity.game.graphics;
    const t = this.time;
    const omega = this.swayTimeFreq;
    const k = this.swaySpaceFreq;
    const envShiftX = -this.envelopeSpeed * t;
    const envS = this.envelopeScale;

    for (const b of this.blades) {
      const env = this._envelope(b.x, b.y, envShiftX, envS);
      if (env <= 0) {
        graphics.triangle(b.x, b.y, b.size, { fill: this.color, rotation: b.baseRot });
        continue;
      }

      const carrier = Math.sin(k * b.x - omega * t);
      const sway = carrier * env * this.swayAmplitude;

      graphics.triangle(b.x, b.y, b.size, {
        fill: this.color,
        rotation: b.baseRot + sway,
      });
    }
  }

  // とんがりを真上（-π/2）基準に、rotationRandomness に比例したズレを加える
  _pickBaseRotation() {
    const up = -Math.PI / 2;
    return up + (Math.random() - 0.5) * Math.PI * 2 * this.rotationRandomness;
  }

  _envelope(x, y, shiftX, scale) {
    const n = this.envelopeNoise.noise((x + shiftX) * scale, y * scale);
    const e = (n - this.envelopeThreshold) * this.envelopeSharpness;
    return e < 0 ? 0 : e > 1 ? 1 : e;
  }

  _generateBlades() {
    const w = this.worldWidth;
    const h = this.worldHeight;
    const cs = this.cellSize;
    const nx = Math.ceil(w / cs);
    const ny = Math.ceil(h / cs);
    const x0 = -w / 2;
    const y0 = -h / 2;
    const blades = [];

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const cx = x0 + (i + 0.5) * cs;
        const cy = y0 + (j + 0.5) * cs;
        const n = this.placementNoise.noise(cx * this.placementScale, cy * this.placementScale);
        if (n < this.placementThreshold) continue;

        const density = Math.min(1, (n - this.placementThreshold) / 0.5);
        const count = 1 + Math.floor(density * (this.maxPerCell - 1));

        for (let c = 0; c < count; c++) {
          blades.push({
            x: cx + (Math.random() - 0.5) * cs,
            y: cy + (Math.random() - 0.5) * cs,
            baseRot: this._pickBaseRotation(),
            size: this.size * (0.7 + Math.random() * 0.6),
          });
        }
      }
    }

    this.blades = blades;
  }
}
