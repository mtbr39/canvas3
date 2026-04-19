import { PerlinNoise } from '../core/PerlinNoise.js';

export class GrassBackground {
  constructor() {
    this.entity = null;
    this.time = 0;

    // === 密度 ===
    // 全体の密度は cellSize（配置間隔）と layer*Threshold（各レイヤーの被覆率）で決まる。
    //   cellSize 小 → 配置点が細かく → 密
    //   threshold 低 → しきい値を超えるセルが増える → 密
    this.cellSize = 120;         // サンプル点のグリッド間隔（小さいほど密）

    this.triangleSize = 80;      // 三角形1枚の半径

    // === クラスタ配置 ===
    // 1セルあたりに描画する三角形の配置
    this.clusterCount = 3;             // クラスタ内の三角形枚数
    this.clusterSpreadRatio = 0.5;     // 中心から各三角形までの距離（triangleSize 比）
    this.clusterCellJitter = 0.6;      // セル中心からのランダムずれ量（cellSize 比、0で格子状）

    this.noiseScale = 0.002;    // ノイズ座標の縮尺（小さいほど模様が大きく滑らか）
    this.windSpeed = 0.4;       // ノイズ自体の流れる速度（風で模様が移動する速さ）
    this.swaySpeed = 1.2;        // 個々の三角形の回転速度（揺れの速さ）
    this.swayAmount = 0.25;      // 揺れの振幅（ラジアン）

    this.layer1Color = '#4E9A6B';          // 下層の色（中間の緑）
    this.layer1Threshold = 0.3;           // 下層の被覆率（低いほど広く覆う＝密）
    this.layer1Noise = new PerlinNoise(7); // 下層用のノイズ

    this.layer2Color = '#B4E080';           // 上層の色（明るい緑）
    this.layer2Threshold = 0.2;            // 上層の被覆率（高いほど斑点状＝疎）
    this.layer2Noise = new PerlinNoise(21); // 上層用のノイズ（別シードで下層と模様をずらす）

    // === LOD（ズームアウト時の粗さ調整）===
    // ズームが下がるほどセルサイズを粗くして、描画数が爆発するのを防ぐ
    this.lodZoomThreshold = 0;   // このズーム値未満で粗くし始める（0 で LOD 無効）
    this.lodScalePerStep = 2;    // 1 段階あたりの粗さ倍率（2 なら半ズームで2倍）
  }

  update() {
    this.time += this.entity.game.deltaTime;
  }

  render() {
    const game = this.entity.game;
    const camera = game.camera;
    const graphics = game.graphics;
    const scale = graphics.scale;
    const dpr = graphics.dpr;
    const screenW = game.canvas.width / dpr;
    const screenH = game.canvas.height / dpr;

    const viewLeft = camera.x / scale;
    const viewTop = camera.y / scale;
    const viewRight = (camera.x + screenW / camera.zoom) / scale;
    const viewBottom = (camera.y + screenH / camera.zoom) / scale;

    // ズームアウト時にセル数が増えすぎないよう段階的に粗くする
    let cs = this.cellSize;
    if (camera.zoom < this.lodZoomThreshold && this.lodScalePerStep > 1) {
      const lod = Math.floor(
        Math.log(this.lodZoomThreshold / camera.zoom) / Math.log(this.lodScalePerStep)
      );
      cs *= Math.pow(this.lodScalePerStep, lod);
    }

    const margin = cs;
    const startX = Math.floor((viewLeft - margin) / cs) * cs;
    const startY = Math.floor((viewTop - margin) / cs) * cs;
    const endX = viewRight + margin;
    const endY = viewBottom + margin;

    this._drawLayer(this.layer1Noise, this.layer1Color, this.layer1Threshold, 0, startX, startY, endX, endY, cs);
    this._drawLayer(this.layer2Noise, this.layer2Color, this.layer2Threshold, 100, startX, startY, endX, endY, cs);
  }

  _drawLayer(noise, color, threshold, seedOffset, startX, startY, endX, endY, cs) {
    const graphics = this.entity.game.graphics;
    const tSize = this.triangleSize;
    const t = this.time;

    for (let x = startX; x < endX; x += cs) {
      for (let y = startY; y < endY; y += cs) {
        const n = noise.noise(x * this.noiseScale + t * this.windSpeed, y * this.noiseScale);
        if (n < threshold) continue;

        const ox = (this._hash(x + seedOffset, y) - 0.5) * cs * this.clusterCellJitter;
        const oy = (this._hash(x, y + seedOffset) - 0.5) * cs * this.clusterCellJitter;
        const baseRot = this._hash(x + 3, y + 5) * Math.PI * 2;

        const count = this.clusterCount;
        const spread = tSize * this.clusterSpreadRatio;
        for (let i = 0; i < count; i++) {
          const localAng = baseRot + i * (Math.PI * 2 / count);
          const dx = Math.cos(localAng) * spread;
          const dy = Math.sin(localAng) * spread;
          const sway = Math.sin(t * this.swaySpeed + x * 0.03 + y * 0.03 + i) * this.swayAmount;
          graphics.triangle(
            x + ox + dx,
            y + oy + dy,
            tSize,
            { fill: color, rotation: localAng + sway }
          );
        }
      }
    }
  }

  _hash(x, y) {
    const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return v - Math.floor(v);
  }
}
