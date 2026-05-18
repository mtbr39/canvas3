// 行動ログ: エンティティの直近の行動ラベルを履歴として保持する。
// データは EntityInfoPanel から参照される（ワールド上には描画しない）。

// 1つのラベルを保持し続ける時間 [秒]
const LABEL_DURATION = 1.5;
// 同時に保持するラベルの上限。超えたら一番古いものから消える
const MAX_STACK = 6;

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

  // ワールド上の文字描画はしない（情報は EntityInfoPanel に集約）。
  // entries は引き続き push/update で保守され、パネルから参照される。
}
