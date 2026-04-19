import { PerlinNoise } from '../core/PerlinNoise.js';

export class GrassBackground {
  constructor() {
    this.entity = null;
    this.time = 0;

    // === 密度 ===
    // タイルに描き込むクラスタの密度
    //   cellSize 小 → 配置点が細かく → 密
    //   threshold 低 → しきい値を超えるセルが増える → 密
    this.cellSize = 80;         // サンプル点のグリッド間隔（小さいほど密）

    this.triangleSize = 80;      // 三角形1枚の半径

    // === クラスタ配置 ===
    // 1セルあたりに描画する三角形の配置
    this.clusterCount = 3;             // クラスタ内の三角形枚数
    this.clusterSpreadRatio = 0.5;     // 中心から各三角形までの距離（triangleSize 比）
    this.clusterCellJitter = 0.6;      // セル中心からのランダムずれ量（cellSize 比、0で格子状）

    this.noiseScale = 0.001;     // ノイズ座標の縮尺（小さいほど模様が大きく滑らか）

    this.layer1Color = '#4E9A6B';          // 下層の色（中間の緑）
    this.layer1Threshold = 0.3;            // 下層の被覆率（低いほど広く覆う＝密）
    this.layer1Noise = new PerlinNoise(7); // 下層用のノイズ

    this.layer2Color = '#B4E080';           // 上層の色（明るい緑）
    this.layer2Threshold = 0.2;             // 上層の被覆率（高いほど斑点状＝疎）
    this.layer2Noise = new PerlinNoise(21); // 上層用のノイズ（別シードで下層と模様をずらす）

    // === タイル（起動時に1回だけ描画するオフスクリーン画像）===
    // 以降はこのタイルを createPattern で貼り付けるだけなので描画コストが一定
    this.tileWorldSize = 16000;   // タイル1枚がカバーする世界座標サイズ（この幅で繰り返す）
    this.tilePxSize = 10240;      // タイル画像の解像度（大きいほど高精細で生成時コスト増）

    // === 風（タイルをスクロールさせる速度、世界座標/秒）===
    // 0 にすれば静止。符号で方向反転。
    this.windSpeedX = 40;
    this.windSpeedY = 3;

    this.tile = null;  // 遅延生成（初回 render 時に作る）
  }

  update() {
    this.time += this.entity.game.deltaTime;
  }

  render() {
    if (!this.tile) this._generateTile();

    const game = this.entity.game;
    const ctx = game.ctx;
    const camera = game.camera;
    const dpr = game.graphics.dpr;

    // カメラ変換の外側で描きたいので、一旦 identity に戻す
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const deviceW = game.canvas.width;
    const deviceH = game.canvas.height;

    // 世界座標1単位あたりのデバイスpx
    const devPxPerWorld = camera.zoom * dpr;
    // タイル画像1pxあたりのデバイスpx
    const imgPxToDevPx = (this.tileWorldSize / this.tilePxSize) * devPxPerWorld;

    // カメラ位置＋時間スクロールに応じたパターンオフセット
    const offX = -(camera.x + this.time * this.windSpeedX) * devPxPerWorld;
    const offY = -(camera.y + this.time * this.windSpeedY) * devPxPerWorld;

    const pattern = ctx.createPattern(this.tile, 'repeat');
    pattern.setTransform(new DOMMatrix([imgPxToDevPx, 0, 0, imgPxToDevPx, offX, offY]));

    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, deviceW, deviceH);

    ctx.restore();
  }

  // タイル上に草模様を生成し、以降は使い回す
  regenerate() {
    this.tile = null;
  }

  _generateTile() {
    const canvas = document.createElement('canvas');
    canvas.width = this.tilePxSize;
    canvas.height = this.tilePxSize;
    const ctx = canvas.getContext('2d');

    const pxPerWorld = this.tilePxSize / this.tileWorldSize;

    this._drawLayerToTile(ctx, this.layer1Noise, this.layer1Color, this.layer1Threshold, 0, pxPerWorld);
    this._drawLayerToTile(ctx, this.layer2Noise, this.layer2Color, this.layer2Threshold, 100, pxPerWorld);

    this.tile = canvas;
  }

  _drawLayerToTile(ctx, noise, color, threshold, seedOffset, pxPerWorld) {
    const T = this.tileWorldSize;
    const cs = this.cellSize;
    const tSize = this.triangleSize;
    const count = this.clusterCount;
    const spread = tSize * this.clusterSpreadRatio;
    const cullRadiusPx = (spread + tSize) * pxPerWorld;
    const tilePx = this.tilePxSize;

    ctx.fillStyle = color;

    const nCells = Math.ceil(T / cs);
    for (let xi = 0; xi < nCells; xi++) {
      for (let yi = 0; yi < nCells; yi++) {
        const cx = xi * cs;
        const cy = yi * cs;

        const n = noise.noise(cx * this.noiseScale, cy * this.noiseScale);
        if (n < threshold) continue;

        const ox = (this._hash(cx + seedOffset, cy) - 0.5) * cs * this.clusterCellJitter;
        const oy = (this._hash(cx, cy + seedOffset) - 0.5) * cs * this.clusterCellJitter;
        const baseRot = this._hash(cx + 3, cy + 5) * Math.PI * 2;

        // シームレスに繋がるよう ±T の9方向に複製して描画
        for (let wx = -1; wx <= 1; wx++) {
          for (let wy = -1; wy <= 1; wy++) {
            const ccx = (cx + ox + wx * T) * pxPerWorld;
            const ccy = (cy + oy + wy * T) * pxPerWorld;

            if (ccx + cullRadiusPx < 0 || ccx - cullRadiusPx > tilePx) continue;
            if (ccy + cullRadiusPx < 0 || ccy - cullRadiusPx > tilePx) continue;

            for (let i = 0; i < count; i++) {
              const localAng = baseRot + i * (Math.PI * 2 / count);
              const dx = Math.cos(localAng) * spread;
              const dy = Math.sin(localAng) * spread;
              this._drawTriangle(ctx,
                ccx + dx * pxPerWorld,
                ccy + dy * pxPerWorld,
                tSize * pxPerWorld,
                localAng
              );
            }
          }
        }
      }
    }
  }

  _drawTriangle(ctx, x, y, r, rotation) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (Math.PI * 2 / 3) * i + rotation;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  _hash(x, y) {
    const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return v - Math.floor(v);
  }
}
