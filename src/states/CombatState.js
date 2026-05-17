import { DecisionState } from './DecisionState.js';

// ============================================================
// 定数: 戦闘の「オーケストレーション」に関するもの。
//   - 「どの条件が揃ったら、どの行動を起こすか」のしきい値・タイミング
// 個々のアクションの素の長さ・距離（DODGE_DURATION 等）は Combat 側に置く。
// ============================================================

// 低HP kiteは最大 MAX_KITE_DURATION 秒で強制終了する。
// 「低HPなら永久に逃げ続ける」挙動を防ぐための上限。kite終了後はCombat側のrestに引き継がれる。
const MAX_KITE_DURATION = 3.0;

// kite終了後、再kite可能になるまでの時間 [秒]。
// REST_DURATION(5秒)より長く設定し、「休憩→即kite」にならないようにする。
// 休憩中もこのタイマーは進むので、休憩明けに少しだけ戦って次のkiteが解禁される運用。
const KITE_COOLDOWN = 12.0;

// 様子見の発火確率 [回/秒]。攻撃クールダウン中の隙間を埋めるための揺さぶり。
const REPOSITION_RATE_PER_SEC = 0.5;

// kite中、毎フレーム指示する「敵から離れる方向の到達先距離」 [ピクセル相当]。
// 毎フレーム上書きするので、実効的には方向ベクトルの大きさ。
const KITE_MOVE_DISTANCE = 150;

// 防御的エンティティが逃げる際、目標地点までの距離 [ピクセル相当]
const FLEE_DISTANCE = 200;

// 仲間がこの距離以上離れていれば「仲間のほうへ逃げる」を優先する
const ALLY_PROXIMITY_THRESHOLD = 1000;

// ============================================================
// CombatState
// 役割: 戦闘中のオーケストレーション。Combat が公開する
//   「条件メソッド (isXxx / shouldXxx / canXxx)」と
//   「アクションメソッド (startXxx / attack)」を組み合わせて、
// その瞬間に何をすべきかを決める。
//
// update() は基本的に [条件 → 行動] のリストとして読める形を保つ。
// 「自分しか持っていない状態（kite中か、kiteクールダウン）」だけ
// このクラスが持ち、その他の戦闘状態は Combat に問い合わせる。
// ============================================================
export class CombatState {
  constructor(returnState = null) {
    this.returnState = returnState;
    this.target = null;
    this.checkInterval = 0.5;
    this.checkTimer = 0;
  }

  enter(entity) {
    this.checkTimer = 0;
    this.kiting = false;
    this.kiteTimer = 0;
    this.kiteIsLowHp = false;
    this.kiteCooldown = 0;
    if (!this.target) this.findTarget(entity);
    entity.getComponent('party')?.clearDestination();
    const movement = entity.getComponent('movement');
    if (movement) {
      // maxSpeed を保存（現在の eased speed ではなく「本来の速度」）。
      // 戦闘中は setSpeed で run/walk を切り替えるので、抜けるときに元に戻す。
      this.baseSpeed = movement.maxSpeed;
    }
    movement?.stop();
  }

  exit(entity) {
    const movement = entity.getComponent('movement');
    if (movement) {
      movement.stop();
      if (this.baseSpeed !== undefined) {
        movement.setSpeed(this.baseSpeed);
        this.baseSpeed = undefined;
      }
    }
    // Combatを抜けたら報復対象を忘れる。再度殴られれば takeDamage で再記録される。
    const health = entity.getComponent('health');
    if (health) health.lastAttacker = null;
    this.target = null;
  }

  // ----------------------------------------------------------
  // メインループ
  //   上から順に「条件が満たされたら対応する行動をしてreturn」。
  //   各ブロックの先頭コメントが「どの状況/関心事か」を示し、
  //   実装は条件メソッド + アクション呼び出しで構成される。
  // ----------------------------------------------------------
  update(entity) {
    this._runUpdate(entity);

    // 毎フレーム「いま何をしているか」をログに push。
    // 同じラベルなら timer がリフレッシュされるだけ（積み増しはしない）。
    // → 状態が継続している間は表示が消えず、切り替わった瞬間に上に積まれる。
    const combat = entity.getComponent('combat');
    if (combat) {
      const label = this._currentActionLabel(entity, combat);
      if (label) entity.getComponent('actionLog')?.push(label);
    }
  }

  _runUpdate(entity) {
    const ctx = this._gather(entity);
    if (!ctx) return;
    const { combat, movement } = ctx;

    // --- 割り込み不可: 現在の動作を最後までやらせる ---
    if (combat.isDodging()) return;
    if (combat.isResting()) { movement.stop(); return; }
    if (combat.isWaiting()) { movement.stop(); return; }

    // --- 反射的回避: 自分への攻撃のwindupを察知したら横にステップ ---
    if (this._tryDodge(ctx)) return;

    // --- ターゲット更新 & 戦闘終了判定 ---
    this._tickRetarget(ctx);
    const target = this.getTarget();
    if (!target) return this._exitToDecision(ctx);

    const targetTransform = target.getComponent('transform');
    if (!targetTransform) return this._exitToDecision(ctx);

    if (this._shouldChaseAlly(ctx, target)) {
      this._setRunSpeed(ctx);
      movement.moveTo(targetTransform.x, targetTransform.y);
      return;
    }
    if (this._isTargetOutOfRange(ctx, target)) return this._exitToDecision(ctx);

    // --- 防御的エンティティ: 戦わずに逃げる ---
    if (!combat.shouldSeekCombat) {
      this._setRunSpeed(ctx);
      const flee = this.getFleeDestination(entity, targetTransform);
      movement.moveTo(flee.x, flee.y);
      return;
    }

    // --- 様子見: 攻撃クールダウン中の隙間を揺さぶりで埋める ---
    if (this._shouldStartReposition(combat)) combat.startReposition();
    if (combat.isRepositioning()) {
      this._setWalkSpeed(ctx);
      movement.moveTo(combat.reposition.targetX, combat.reposition.targetY);
      return;
    }

    // --- 距離どり(kite)の状態更新 ---
    const centerDistance = entity.game.spatialQuery.getDistance(entity, target);
    this._tickKite(ctx, centerDistance);

    // --- kite明けで低HPだったなら休憩へ ---
    if (this._kiteJustEndedAtLowHp()) {
      combat.startRest();
      this._consumeKiteEnd();
      return;
    }
    if (this._kiteJustEnded()) this._consumeKiteEnd();

    // --- kite中: 後退しつつ射程に入れば撃つ ---
    if (this.kiting) {
      this._kiteAndAttack(ctx, target, centerDistance);
      return;
    }

    // --- 通常: 射程内なら攻撃、外なら接近 ---
    this._engageOrApproach(ctx, target, centerDistance);
  }

  // フレーム末の「現在の行動」ラベル。状態フラグを優先度順に見て決める。
  // - 起動中の動作（休憩/回避/攻撃windup/様子見）が最優先
  // - 次に距離どり(kiting)
  // - 移動中なら「逃走」or「接近」
  // - それ以外は射程内で構えている／クールダウン待ち
  _currentActionLabel(entity, combat) {
    if (combat.isResting()) return '休憩';
    if (combat.isDodging()) return '回避';
    if (combat.isWaiting()) return 'その場待機';
    if (combat.windup) return combat.windup.weapon.name;
    if (combat.isRepositioning()) return '様子見';
    if (this.kiting) return '距離取り';

    const target = this.getTarget();
    if (!target) return null;

    if (!combat.shouldSeekCombat) return '逃走';

    const dist = entity.game.spatialQuery.getDistance(entity, target);
    if (dist > combat.getWeaponRange()) return '接近';
    if (!combat.canAttack()) return '待機';
    return '構え';
  }

  // ----------------------------------------------------------
  // セットアップ / ヘルパ
  // ----------------------------------------------------------

  _gather(entity) {
    const combat = entity.getComponent('combat');
    const transform = entity.getComponent('transform');
    const movement = entity.getComponent('movement');
    const behavior = entity.getComponent('behavior');
    if (!combat || !transform || !movement || !behavior) return null;
    return { entity, combat, transform, movement, behavior, dt: entity.game.deltaTime };
  }

  _exitToDecision({ behavior }) {
    behavior.changeState(this.returnState ?? new DecisionState());
  }

  getTarget() {
    if (!this.target) return null;
    const health = this.target.getComponent('health');
    if (!health || health.isDead) return null;
    return this.target;
  }

  findTarget(entity) {
    // 既存ターゲットが生きていれば維持する。
    // detectionRangeは「索敵範囲」であり、戦闘継続範囲はchaseRange側で判定されるため、
    // 様子見/kiteで一時的にdetectionRange外に出てもターゲットを失わせない。
    if (this.target && !this.target.getComponent('health')?.isDead) return;
    const combat = entity.getComponent('combat');
    this.target = combat ? combat.findNearbyEnemy() : null;
  }

  _tickRetarget({ entity, dt }) {
    this.checkTimer += dt;
    if (this.checkTimer >= this.checkInterval) {
      this.checkTimer = 0;
      this.findTarget(entity);
    }
  }

  // ----------------------------------------------------------
  // 個々の (条件 → 行動) ブロック
  // ----------------------------------------------------------

  // 反射的回避。回避すべきかは Combat.shouldDodge() が判定する。
  // 方向（攻撃線に対して垂直 / 左右ランダム）は CombatState が決める。
  _tryDodge({ combat, transform }) {
    const dodgeFrom = combat.consumeDodgePlan();
    if (!dodgeFrom) return false;
    const fromT = dodgeFrom.getComponent('transform');
    if (!fromT) return false;

    // 攻撃者→自分の方向ベクトル (dx, dy) を求め、それに垂直な単位ベクトルを作る。
    // 2D で (dx, dy) に垂直なのは (-dy, dx) と (dy, -dx) の2つ → どちらに避けるかは sign でランダムに選ぶ。
    // 結果として「攻撃の軌道線に対して真横」へステップする向きが決まる。
    const dx = transform.x - fromT.x;
    const dy = transform.y - fromT.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const sign = Math.random() < 0.5 ? 1 : -1;
    const perpX = -dy / d * sign;
    const perpY = dx / d * sign;
    return combat.startDodge(perpX, perpY);
  }

  // 攻撃中の味方（this.isAllyTarget）が遠くにいる場合は、距離制限を無視して追いかける。
  // 自分のchaseRange内に入ったら通常戦闘ロジックへシームレスに移行（フラグ解除）。
  _shouldChaseAlly({ entity, combat }, target) {
    if (!this.isAllyTarget) return false;
    const dist = entity.game.spatialQuery.getDistance(entity, target);
    if (dist > combat.chaseRange) return true;
    this.isAllyTarget = false;
    return false;
  }

  // 攻撃側はchaseRangeを超えたら、防御側は相手のchaseRange × fleeStopMultiplier を超えたら終了。
  _isTargetOutOfRange({ entity, combat }, target) {
    const dist = entity.game.spatialQuery.getDistance(entity, target);
    const stopRange = combat.shouldSeekCombat
      ? combat.chaseRange
      : (target.getComponent('combat')?.chaseRange ?? combat.chaseRange) * combat.fleeStopMultiplier;
    return dist > stopRange;
  }

  // 様子見トリガー判定。攻撃クールダウン中の隙間を埋めるように、
  // 「攻撃できない・割り込み不可な動作中でない」時に確率で発火する。
  _shouldStartReposition(combat) {
    if (combat.canAttack()) return false;
    if (combat.isBusy() || combat.isDodging()) return false;
    if (combat.isRepositioning()) return false;
    return Math.random() < REPOSITION_RATE_PER_SEC * combat.entity.game.deltaTime;
  }

  // kite状態（this.kiting）の遷移。ヒステリシスで開始/解除を分けて反復を防ぐ。
  _tickKite({ combat, dt }, centerDistance) {
    if (this.kiteCooldown > 0) this.kiteCooldown -= dt;

    const wasKiting = this.kiting;
    const kiteRange = combat.getKiteRange();
    const kiteStopRange = combat.getKiteStopRange();

    if (kiteRange > 0 && this.kiteCooldown <= 0) {
      if (centerDistance < kiteRange) {
        if (!this.kiting) this.kiteIsLowHp = combat.isLowHp();
        this.kiting = true;
      } else if (centerDistance > kiteStopRange) {
        this.kiting = false;
      }
    } else {
      this.kiting = false;
    }

    if (this.kiting) {
      this.kiteTimer += dt;
      // 低HP kiteは継続時間の上限で強制終了。ここで止めないと永久に逃げ続けてしまう。
      if (this.kiteIsLowHp && this.kiteTimer >= MAX_KITE_DURATION) this.kiting = false;
    }

    this._kiteEndedThisTick = wasKiting && !this.kiting;
  }

  _kiteJustEnded() {
    return this._kiteEndedThisTick === true;
  }

  _kiteJustEndedAtLowHp() {
    return this._kiteEndedThisTick === true && this.kiteIsLowHp;
  }

  // kite終了時の後始末（タイマーリセット、クールダウン開始）。
  // 「終了」を検知する箇所と「後始末」する箇所を分けるため独立メソッドにしてある。
  _consumeKiteEnd() {
    this.kiteTimer = 0;
    this.kiteCooldown = KITE_COOLDOWN;
    this._kiteEndedThisTick = false;
  }

  // kite中: 敵から離れる方向に毎フレーム新しい移動先を再計算し、射程に入れば撃つ。
  _kiteAndAttack(ctx, target, centerDistance) {
    const { combat, transform, movement } = ctx;
    const targetTransform = target.getComponent('transform');
    const dx = transform.x - targetTransform.x;
    const dy = transform.y - targetTransform.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this._setRunSpeed(ctx);
    movement.moveTo(
      transform.x + (dx / d) * KITE_MOVE_DISTANCE,
      transform.y + (dy / d) * KITE_MOVE_DISTANCE
    );
    if (centerDistance <= combat.getWeaponRange() && combat.canAttack()) {
      combat.attack(target);
    }
  }

  // 通常戦闘: 射程内なら止まって攻撃、外なら近づく。
  _engageOrApproach(ctx, target, centerDistance) {
    const { combat, movement } = ctx;
    const targetTransform = target.getComponent('transform');
    if (centerDistance <= combat.getWeaponRange()) {
      movement.stop();
      if (combat.canAttack()) combat.attack(target);
    } else {
      this._setRunSpeed(ctx);
      movement.moveTo(targetTransform.x, targetTransform.y);
    }
  }

  // 走る: 逃走・接近・距離どりで使う。baseSpeed に走る倍率を掛けた値を目標速度にセット。
  // 実際の速度は Movement 側で滑らかに追従する。
  _setRunSpeed({ combat, movement }) {
    if (this.baseSpeed === undefined) return;
    movement.setSpeed(this.baseSpeed * combat.runSpeedMultiplier);
  }

  // 歩く: 様子見など、戦闘中でも緩い移動で使う。baseSpeed そのまま。
  _setWalkSpeed({ movement }) {
    if (this.baseSpeed === undefined) return;
    movement.setSpeed(this.baseSpeed);
  }

  // ----------------------------------------------------------
  // 防御的エンティティの逃走先
  // ----------------------------------------------------------

  getFleeDestination(entity, targetTransform) {
    const transform = entity.getComponent('transform');

    const nearestAlly = this.findNearestAlly(entity);
    if (nearestAlly) {
      const allyTransform = nearestAlly.getComponent('transform');
      const dx = transform.x - allyTransform.x;
      const dy = transform.y - allyTransform.y;
      const distToAlly = Math.sqrt(dx * dx + dy * dy);
      if (distToAlly > ALLY_PROXIMITY_THRESHOLD) {
        return { x: allyTransform.x, y: allyTransform.y };
      }
    }

    const dx = transform.x - targetTransform.x;
    const dy = transform.y - targetTransform.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: transform.x, y: transform.y };
    return {
      x: transform.x + (dx / dist) * FLEE_DISTANCE,
      y: transform.y + (dy / dist) * FLEE_DISTANCE,
    };
  }

  findNearestAlly(entity) {
    const party = entity.getComponent('party');
    if (!party || !party.isInParty()) return null;

    const transform = entity.getComponent('transform');
    let nearest = null;
    let nearestDist = Infinity;

    for (const member of party.getMembers()) {
      if (member === entity) continue;
      const health = member.getComponent('health');
      if (!health || health.isDead) continue;
      const mt = member.getComponent('transform');
      if (!mt) continue;
      const dx = transform.x - mt.x;
      const dy = transform.y - mt.y;
      const d = dx * dx + dy * dy;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = member;
      }
    }
    return nearest;
  }
}
