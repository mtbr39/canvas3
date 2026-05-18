export class SlashEffect {
  constructor() {
    this.entity = null;
    this.timer = 0;
    // 振り始めから振り終わりまでの時間（秒）。ヒットボックスの寿命とは独立。
    // 小さいほど速く振り抜ける。
    this.duration = 0.5;
    this.dirX = 1;
    this.dirY = 0;
    this.originX = 0;
    this.originY = 0;
    this.swingRadius = 50;
    // 振りの全角度（ラジアン）。大きいほど大振り。
    this.arcAngle = Math.PI * 0.8;
    // 棒の太さ（描画線幅）
    this.thickness = 6;
    this.colorRgb = '255, 255, 255';
    // 軌跡を描く分割数。多いほど滑らかだが描画コスト増。
    this.segments = 12;
    // 描画する刀身の長さ。swingRadius からこの長さぶん手前までを描画する。
    this.bladeLength = 40;
    // 軌跡の残り具合 (0.0〜1.0)。arcAngle に対する最大スパンの割合。
    //   0.0 = 軌跡なし、1.0 = 振り始めから現在までずっと残る
    this.trailRatio = 1.0;
    // 軌跡の最大不透明度 (0.0〜1.0)。大きいほど軌跡が濃く目立つ。
    this.trailAlpha = 1.0;
  }

  show({ dirX, dirY, originX, originY, swingRadius }) {
    this.timer = this.duration;
    this.dirX = dirX;
    this.dirY = dirY;
    this.originX = originX;
    this.originY = originY;
    this.swingRadius = swingRadius;
  }

  update() {
    if (this.timer > 0) {
      this.timer -= this.entity.game.deltaTime;
      if (this.timer <= 0) {
        this.entity.game.markEntityForRemoval(this.entity);
      }
    }
  }

  render() {
    if (this.timer <= 0) return;

    const progress = 1 - this.timer / this.duration;
    const baseAngle = Math.atan2(this.dirY, this.dirX);
    const startAngle = baseAngle - this.arcAngle / 2;
    const currentAngle = startAngle + this.arcAngle * progress;

    const graphics = this.entity.game.graphics;

    // 振り抜きの軌跡: 過去の刀身位置（base→tip の線分）を薄く重ねる
    const innerR = Math.max(0, this.swingRadius - this.bladeLength);
    const trailSpan = Math.min(this.arcAngle * progress, this.arcAngle * this.trailRatio);
    if (trailSpan > 0.01) {
      for (let i = 0; i < this.segments; i++) {
        const t = i / this.segments;
        const a = currentAngle - trailSpan * (1 - t);
        const c = Math.cos(a);
        const s = Math.sin(a);
        const segAlpha = (1 - progress) * this.trailAlpha * t;
        if (segAlpha <= 0.01) continue;
        graphics.line(
          this.originX + c * innerR,
          this.originY + s * innerR,
          this.originX + c * this.swingRadius,
          this.originY + s * this.swingRadius,
          {
            stroke: `rgba(${this.colorRgb}, ${segAlpha.toFixed(2)})`,
            strokeWidth: this.thickness * 0.8,
            worldSpace: true,
          }
        );
      }
    }

    // 棒本体: 根本側は描かず、先端から bladeLength 分だけ描く
    const cos = Math.cos(currentAngle);
    const sin = Math.sin(currentAngle);
    const tipX = this.originX + cos * this.swingRadius;
    const tipY = this.originY + sin * this.swingRadius;
    const baseX = this.originX + cos * innerR;
    const baseY = this.originY + sin * innerR;
    const alpha = (1 - progress) * 0.8 + 0.2;
    graphics.line(baseX, baseY, tipX, tipY, {
      stroke: `rgba(${this.colorRgb}, ${alpha.toFixed(2)})`,
      strokeWidth: this.thickness,
      worldSpace: true,
    });
  }
}
