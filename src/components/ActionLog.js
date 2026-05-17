// 行動ログ: エンティティの直近の行動ラベルを一定時間ずつ表示する。
// 新しい行動ラベルが追加されると、前のラベルの「上に」積み上がっていく（古いほど上、新しいほど下）。
// 各ラベルは LABEL_DURATION 経過で消える。状態がめまぐるしく切り替わる瞬間も、
// 履歴として残るので「いまどの行動を踏んでいるか」が目で追える。

// ====== 表示パラメータ ======
// 1つのラベルを表示し続ける時間 [秒]
const LABEL_DURATION = 1.5;
// 消える直前にフェードアウトする時間 [秒]（この秒数を切ったら徐々に透明になる）
const FADE_DURATION = 0.4;
// 同時に表示するラベルの上限。超えたら一番古いものから消える
const MAX_STACK = 6;
// 行間 [ピクセル相当]
const LINE_HEIGHT = 13;
// フォントサイズ
const FONT_SIZE = 11;
// エンティティ外周からラベル群の一番下までの距離 [ピクセル相当]
const VERTICAL_OFFSET = 22;

export class ActionLog {
  constructor() {
    this.entity = null;
    // entries[0] = 一番古い、entries[last] = 一番新しい
    this.entries = [];
  }

  // 新しい行動ラベルを積む。
  //   - 直前と同じラベルが生き残っているなら、新規追加せず timer をリフレッシュ。
  //     → 継続中の状態（接近・距離取りなど）を毎フレーム push しても 1 行にまとまり、
  //       状態が続いている間は表示が消えない。
  //   - 異なるラベルなら新エントリを上に積む。前のエントリは自分の残り時間ぶんだけ残って消える。
  push(label) {
    if (!label) return;
    const latest = this.entries[this.entries.length - 1];
    if (latest && latest.label === label && latest.timer > 0) {
      latest.timer = LABEL_DURATION;
      return;
    }
    this.entries.push({ label, timer: LABEL_DURATION });
    if (this.entries.length > MAX_STACK) this.entries.shift();
  }

  update() {
    const dt = this.entity.game.deltaTime;
    for (const e of this.entries) e.timer -= dt;
    this.entries = this.entries.filter((e) => e.timer > 0);
  }

  render() {
    if (this.entries.length === 0) return;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    const game = this.entity.game;

    const collider = this.entity.getComponent('collider');
    const radius = collider?.shape?.type === 'circle' ? collider.shape.radius : 0;
    // baseY = 一番新しいラベルが描かれる y 座標（エンティティの真上）
    const baseY = transform.y - radius - VERTICAL_OFFSET;

    const n = this.entries.length;
    for (let i = 0; i < n; i++) {
      const entry = this.entries[i];
      // i=0 が古い → 上 (画面では小さい y)、i=n-1 が新しい → 下 (baseY)
      const stackFromBottom = n - 1 - i;
      const y = baseY - stackFromBottom * LINE_HEIGHT;

      const alpha = Math.min(1, entry.timer / FADE_DURATION);
      game.graphics.text(transform.x, y, entry.label, {
        fill: `rgba(0, 0, 0, ${alpha})`,
        fontSize: FONT_SIZE,
      });
    }
  }
}
