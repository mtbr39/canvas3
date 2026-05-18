// 速度変更時のデフォルト加減速 [px/秒^2]。
// setSpeed で目標速度を変えると、ここで決まる加速度で滑らかに追従する。
// 呼び出し側で第2引数に大きな値を渡せば「ほぼ瞬時に到達」も可能。
const SPEED_ACCEL = 100;
// 停止時の滑走距離 [px]。停止開始時の速度に応じて減速度を決めるための係数。
// 速度に関わらずこの距離だけ滑って止まるよう、減速度 = speed^2 / (2 * SLIDE_DISTANCE) となる。
const SLIDE_DISTANCE = 20;

export class Movement {
  constructor(speed = 100) {
    this.entity = null;
    // maxSpeed: 目標トップスピード（setSpeed で変更）。
    // speed:    現在の実効速度。moving中は maxSpeed に、停止中は 0 に向けて緩やかに変化する。
    //           これにより「止まっている状態から急に最高速で動き出す」のを防ぐ。
    this.maxSpeed = speed;
    this.speed = 0;
    this.accel = SPEED_ACCEL;
    this.stopDecel = 0;
    this.targetX = null;
    this.targetY = null;
    this.moving = false;
  }

  // accel を渡すと、次に speed が maxSpeed に到達するまでその加速度で追従する。
  // 到達後はデフォルトに戻る（_tickSpeed で reset）。accel を省略すると現在値を維持。
  // 例: setSpeed(maxSpeed, 2000) で「一気に最高速まで戻す」用途。
  setSpeed(target, accel) {
    this.maxSpeed = target;
    if (accel !== undefined) this.accel = accel;
  }

  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.moving = true;
  }

  stop() {
    this.targetX = null;
    this.targetY = null;
    // 停止に切り替わった瞬間だけ減速度を確定する。
    // 毎フレーム stop() が呼ばれても、減衰中の速度で再計算して減速が緩んでいかないようにする。
    if (this.moving) {
      this.stopDecel = this.speed > 0
        ? (this.speed * this.speed) / (2 * SLIDE_DISTANCE)
        : 0;
      this.moving = false;
    }
  }

  hasArrived() {
    return !this.moving;
  }

  update() {
    const game = this.entity.game;
    const dt = game.deltaTime;

    this._tickSpeed(dt);

    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    if (this.moving) {
      const dx = this.targetX - transform.x;
      const dy = this.targetY - transform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = this.speed * dt;

      if (dist <= step) {
        transform.x = this.targetX;
        transform.y = this.targetY;
        this.stop();
        return;
      }

      transform.direction = Math.atan2(dy, dx);
      transform.x += (dx / dist) * step;
      transform.y += (dy / dist) * step;
    } else if (this.speed > 0) {
      // 停止指示後も、speed が 0 に減衰しきるまで最後の向きへ滑走する。
      const step = this.speed * dt;
      transform.x += Math.cos(transform.direction) * step;
      transform.y += Math.sin(transform.direction) * step;
    }
  }

  _tickSpeed(dt) {
    const target = this.moving ? this.maxSpeed : 0;
    if (this.speed === target) {
      this.accel = SPEED_ACCEL;
      return;
    }
    const diff = target - this.speed;
    const rate = this.moving ? this.accel : this.stopDecel;
    const maxStep = rate * dt;
    if (Math.abs(diff) <= maxStep) {
      this.speed = target;
      this.accel = SPEED_ACCEL;
    } else {
      this.speed += Math.sign(diff) * maxStep;
    }
  }
}
