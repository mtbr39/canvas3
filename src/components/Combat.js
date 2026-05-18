import { createAttackHitbox } from '../entities/AttackHitbox.js';
import { createSlashEffect } from '../entities/SlashEffect.js';
import { RANGE_TIERS, WINDUP_BY_SPEED, DEFAULT_WINDUP_SPEED } from '../data/Items.js';

// デバッグ用: true にすると、slash エフェクト武器でもヒットボックスの円を表示する。
const DEBUG_SHOW_HITBOX_CIRCLE = false;

// ============================================================
// 定数: 戦闘の「身体性能」に関するもの。
//   - このエンティティが戦闘でどのくらい速く動けるか / どこまで耐えられるか
//   - 距離どり(kite)・休憩(rest)・回避(dodge)・予備動作(windup)の素の長さや距離
// 「どの状況でどの行動を起こすか」=オーケストレーションの定数は CombatState 側に置く。
// ============================================================

// --- 移動・回避 ---
// 攻撃の予備動作を見てから回避を起動するまでの遅延 [秒]
// この値より windup が短い武器は反応できずに被弾する → 軽量武器が回避困難になる根拠
const REACTION_TIME = 0.25;
// 連続回避を防ぐクールダウン [秒]。回避完了から次の回避が許可されるまで
const DODGE_COOLDOWN = 2.0;
// 1回の回避でずれる距離 [ピクセル相当]
const DODGE_DISTANCE = 160;
// 回避モーションの最大所要時間 [秒]。実際は目的地到達で早めに終わることが多い。
const DODGE_DURATION = 0.5;
// 回避中の最高速度 [px/秒]。DODGE_DISTANCE を短時間で踏破するため高めに。
const DODGE_SPEED = 400;
// 回避時の加速度 [px/秒^2]。SPEED_ACCEL より十分大きく、ダッシュ感を出す。
const DODGE_ACCEL = 300;

// --- 攻撃 ---
// 武器の予備動作の長さ [秒] は Items.js の WINDUP_BY_SPEED で定義。
// fast は REACTION_TIME(0.25) を下回るので回避困難 → 軽量武器の利点

// --- HP判定 ---
// 体力がこの比率を下回ったら低HP扱い（kite起動条件・休憩遷移で参照）
const LOW_HP_THRESHOLD = 0.35;

// --- 距離どり（kite）レンジ ---
// 遠隔武器のkite開始距離 = 武器射程 × この倍率。射程の半分まで近づかれたら離れる
const KITE_RANGE_RANGED = 0.5;
// 遠隔武器のkite停止距離 = 武器射程 × この倍率。ここまで離れたらkiteを止める（距離どりの目標）
const KITE_STOP_RANGED = 0.8;
// 低HP近接の退避距離 [ピクセル相当]。武器射程に依存せず固定
const KITE_RANGE_LOW_HP_MELEE = 200;
// 低HP近接のkite停止距離 [ピクセル相当]
const KITE_STOP_LOW_HP_MELEE = 320;

// --- 休憩 ---
// 休憩(rest)の最大時間 [秒]
const REST_DURATION = 5.0;
// 休憩中のHP再生倍率（通常regenRateにこれを掛ける）
const REST_REGEN_MULTIPLIER = 3.0;
// 休憩中の最低保証 regen [HP/秒]。素のregenRateが0でも休憩中は回復させる
const MIN_REST_REGEN = 5.0;

// --- その場待機 ---
// 回避明けなど「動作の硬直」として使う短い停止のデフォルト時間 [秒]。
// rest と違い HP は回復しない。
const WAIT_DURATION = 0.5;


// ============================================================
// Combat コンポーネント
// 役割: 「このエンティティが戦闘で何をできるか」=能力と現在の戦闘状態を持つ。
//
//   - 状態クエリ (isXxx / canXxx / hasXxx): 「いま◯◯か?」
//   - 距離クエリ (getXxxRange): 「攻撃/距離どりの目安距離は?」
//   - 索敵クエリ (findXxx): 「攻撃対象/脅威となるエンティティを返す」
//   - アクション (startXxx / attack): 「◯◯を起動する。起動可否は内部条件で判断」
//
// 状況判断（どの条件を組み合わせて何をするか）は CombatState 側の責務。
// Combat が公開する条件メソッド群を組み合わせて行動が決まる。
// ============================================================
export class Combat {
  constructor(shouldSeekCombat = false, detectionRange, chaseRange, runSpeedMultiplier = 1) {
    this.entity = null;
    this.shouldSeekCombat = shouldSeekCombat;
    this.cooldownTimer = 0;
    // 戦闘中に「走る」ときの通常移動速度に対する倍率。
    // 逃走・接近・距離どり(kite)に適用される。様子見など緩い移動は1倍のまま。
    this.runSpeedMultiplier = runSpeedMultiplier;
    this.fleeStopMultiplier = 1.5;
    this.detectionRange = detectionRange;
    this.chaseRange = chaseRange ?? detectionRange * 1.5;
    this.windup = null;
    this.reactionTime = REACTION_TIME;
    this.dodgeCooldown = 0;
    this.perceiving = null;
    this.dodge = null;
    this.reposition = null;
    this.rest = null;
    this.wait = null;
  }

  static createAggressive(detectionRange, chaseRange, runSpeedMultiplier) {
    return new Combat(true, detectionRange, chaseRange, runSpeedMultiplier);
  }

  static createDefensive(detectionRange, chaseRange, runSpeedMultiplier) {
    return new Combat(false, detectionRange, chaseRange, runSpeedMultiplier);
  }

  // ----------------------------------------------------------
  // 状態クエリ (conditions)
  //   このエンティティ自身の状態についての yes/no。副作用なし。
  // ----------------------------------------------------------

  // 攻撃の予備動作中は割り込み不可。
  // 新しい「割り込み不可な動作」を作るときは、ここに条件を足していく。
  isBusy() {
    return this.windup !== null;
  }

  isDodging() {
    return this.dodge !== null;
  }

  isRepositioning() {
    return this.reposition !== null;
  }

  isResting() {
    return this.rest !== null;
  }

  isWaiting() {
    return this.wait !== null;
  }

  // HPが低危険域に入っているか。kite起動条件と休憩遷移の両方で参照する。
  isLowHp() {
    const health = this.entity.getComponent('health');
    if (!health || health.maxHealth <= 0) return false;
    return health.currentHealth / health.maxHealth < LOW_HP_THRESHOLD;
  }

  canAttack() {
    return this.cooldownTimer <= 0 && !this.windup;
  }

  // 反応時間が満ちて回避クールダウンも明けたか。
  // true なら回避すべき。consumeDodgePlan() で発生源を取り出して回避方向を決める。
  shouldDodge() {
    if (this.dodge) return false;
    if (!this.perceiving) return false;
    if (this.perceiving.timer > 0) return false;
    if (this.dodgeCooldown > 0) return false;
    return true;
  }

  // 回避すべきならその発生源（自分にwindup中の敵）を返し、内部状態をリセット。
  // shouldDodge() でガードしてから呼ぶ想定（呼ばれた時点でリセットされる）。
  consumeDodgePlan() {
    if (!this.shouldDodge()) return null;
    const from = this.perceiving.from;
    this.perceiving = null;
    return from;
  }

  // ----------------------------------------------------------
  // 距離クエリ (conditions / 距離の目安)
  //   状況判断に使う距離値。副作用なし。
  // ----------------------------------------------------------

  // 近接武器のヒットボックス中心までの距離。
  // 自分の collider 円の外側に「自分の半径分」の空白を空けてから武器の hitbox 円を置く。
  getMeleeHitboxDistance(weapon) {
    const collider = this.entity.getComponent('collider');
    const ownRadius = collider?.shape?.type === 'circle' ? collider.shape.radius : 0;
    return ownRadius * 2 + weapon.hitbox.radius;
  }

  getWeaponRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 50;

    const weapon = equipment.getWeapon();
    if (weapon.attackType === 'melee') {
      return this.getMeleeHitboxDistance(weapon) + weapon.hitbox.radius;
    } else {
      return RANGE_TIERS[weapon.projectile.range];
    }
  }

  // 接近されたときに離れたい内側の距離。0なら離れない。
  //   - 遠隔: 常に kite する（半端な距離だと撃ちにくいので射程の半分まで離す）
  //   - 近接: 低HPのときだけ kite する（普段は接近して殴る）
  getKiteRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 0;
    const weapon = equipment.getWeapon();

    if (weapon.attackType === 'ranged') {
      return this.getWeaponRange() * KITE_RANGE_RANGED;
    }
    if (this.isLowHp()) {
      return KITE_RANGE_LOW_HP_MELEE;
    }
    return 0;
  }

  // kiteを解除する外側の距離。ヒステリシスで「離れる→止まる→近づかれる→離れる」の反復を防ぐ。
  getKiteStopRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 0;
    const weapon = equipment.getWeapon();

    if (weapon.attackType === 'ranged') {
      return this.getWeaponRange() * KITE_STOP_RANGED;
    }
    if (this.isLowHp()) {
      return KITE_STOP_LOW_HP_MELEE;
    }
    return 0;
  }

  // ----------------------------------------------------------
  // 索敵クエリ (conditions)
  //   周囲のエンティティから条件にあうものを返す。副作用なし。
  // ----------------------------------------------------------

  _isHostile(other) {
    const relationship = this.entity.getComponent('relationship');
    if (!relationship) return false;
    return relationship.isHostile(other);
  }

  findNearbyEnemy() {
    const transform = this.entity.getComponent('transform');
    if (!transform) return null;

    const game = this.entity.game;
    const results = game.spatialQuery.findNearbyEntities(
      game.entities, transform.x, transform.y, this.detectionRange,
      (e) => {
        if (e === this.entity) return false;
        const health = e.getComponent('health');
        if (!health || health.isDead) return false;
        return this._isHostile(e);
      }
    );

    return results.length > 0 ? results[0].entity : null;
  }

  // Combatに入るべきならターゲットを返す。理由（報復 or 索敵）はここに集約する。
  // 被攻撃時は shouldSeekCombat に関わらず反撃するが、相手が敵対関係にある場合に限る。
  // 「攻撃された」=「敵」ではない判断は Relationship に委ねている。
  findCombatTrigger() {
    const attacker = this.entity.getComponent('health')?.lastAttacker;
    if (attacker && !attacker.getComponent('health')?.isDead && this._isHostile(attacker)) {
      return attacker;
    }
    if (this.shouldSeekCombat) return this.findNearbyEnemy();
    return null;
  }

  // 自分を狙っている windup中の敵を返す。なければ null。
  findIncomingAttack() {
    const transform = this.entity.getComponent('transform');
    if (!transform) return null;

    const game = this.entity.game;
    const nearby = game.spatialQuery.findNearbyEntities(
      game.entities, transform.x, transform.y, this.detectionRange,
      (e) => e !== this.entity && this._isHostile(e)
    );

    for (const result of nearby) {
      const enemyCombat = result.entity.getComponent('combat');
      if (!enemyCombat?.windup) continue;
      if (enemyCombat.windup.target === this.entity) {
        return result.entity;
      }
    }
    return null;
  }

  // ----------------------------------------------------------
  // アクション
  //   状態を変える操作。「自分しか知らない起動可否条件」だけここで守り、
  //   状況判断（HPが低い・距離が近い 等）は呼び出し側に任せる。
  //   起動できなければ false を返す。
  // ----------------------------------------------------------

  // 休憩: その場に留まり、HP再生速度を一時的にブーストする。
  startRest() {
    if (this.rest || this.isBusy() || this.isDodging() || this.isRepositioning()) return false;
    const health = this.entity.getComponent('health');
    if (!health) return false;

    this.rest = {
      timer: 0,
      duration: REST_DURATION,
      originalRegenRate: health.regenRate,
      healthCheckpoint: health.currentHealth,
    };
    health.regenRate = Math.max(health.regenRate * REST_REGEN_MULTIPLIER, MIN_REST_REGEN);
    this.entity.getComponent('movement')?.stop();
    return true;
  }

  // その場待機: 一定時間その場に留まる。rest と違い HP は回復しない。
  // 回避明けの硬直など、動作後の短い停止に使う。
  startWait(duration = WAIT_DURATION) {
    if (this.wait || this.isBusy() || this.isDodging() || this.isResting()) return false;
    this.wait = { timer: 0, duration };
    this.entity.getComponent('movement')?.stop();
    return true;
  }

  // 様子見: 現在地から半径 radius 内のランダムな点に移動。
  // 攻撃クールダウン中などに揺さぶりとして発火させる想定。
  startReposition(radius = 120, duration = 4.0) {
    if (this.reposition || this.isBusy() || this.isDodging()) return false;
    const transform = this.entity.getComponent('transform');
    if (!transform) return false;

    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * (radius - 40);
    this.reposition = {
      targetX: transform.x + Math.cos(angle) * dist,
      targetY: transform.y + Math.sin(angle) * dist,
      timer: duration,
    };
    return true;
  }

  // dirX, dirY は呼び出し側（CombatState）が決定した回避方向の単位ベクトル。
  // CombatState は「攻撃者→自分」のベクトルに対して垂直な方向を、左右ランダムに選んで渡す。
  // → 攻撃の軌道に対して横方向にステップするので、攻撃線から外れて被弾を避けられる。
  startDodge(dirX, dirY) {
    if (this.dodge || this.dodgeCooldown > 0) return false;
    if (this.isBusy()) return false;
    const transform = this.entity.getComponent('transform');
    const movement = this.entity.getComponent('movement');
    if (!transform || !movement) return false;

    this.dodge = {
      timer: 0,
      duration: DODGE_DURATION,
    };
    this.dodgeCooldown = DODGE_COOLDOWN;
    transform.direction = Math.atan2(dirY, dirX);

    // Movement に高加速度で DODGE_SPEED を指示し、回避先へ moveTo。
    // 位置補間は Movement.update に任せる。瞬間移動ではなく加速度のあるダッシュになる。
    movement.setSpeed(DODGE_SPEED, DODGE_ACCEL);
    movement.moveTo(
      transform.x + dirX * DODGE_DISTANCE,
      transform.y + dirY * DODGE_DISTANCE
    );
    this.entity.getComponent('afterImage')?.trigger(DODGE_DURATION);
    return true;
  }

  attack(targetEntity) {
    if (!this.canAttack()) return false;

    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return false;

    const weapon = equipment.getWeapon();

    const transform = this.entity.getComponent('transform');
    const targetTransform = targetEntity.getComponent('transform');
    if (!transform || !targetTransform) return false;

    const dx = targetTransform.x - transform.x;
    const dy = targetTransform.y - transform.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return false;

    const dirX = dx / distance;
    const dirY = dy / distance;

    const windupDuration = WINDUP_BY_SPEED[weapon.windupSpeed ?? DEFAULT_WINDUP_SPEED];

    this.windup = {
      weapon,
      target: targetEntity,
      dirX,
      dirY,
      timer: windupDuration,
      duration: windupDuration,
    };
    this.cooldownTimer = windupDuration + weapon.cooldown;

    return true;
  }

  // ----------------------------------------------------------
  // 内部更新（タイマー進行・自動遷移）
  // ----------------------------------------------------------

  update() {
    const game = this.entity.game;
    const dt = game.deltaTime;

    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;

    if (this.windup) this._tickWindup(dt);
    if (this.dodge) this._tickDodge(dt);
    if (this.reposition) this._tickReposition(dt);
    if (this.rest) this._tickRest(dt);
    if (this.wait) this._tickWait(dt);

    this._tickPerception(dt);
  }

  _tickWindup(dt) {
    this.windup.timer -= dt;
    if (this.windup.timer <= 0) {
      this._executeWindupAttack();
      this.windup = null;
    }
  }

  _tickDodge(dt) {
    const d = this.dodge;
    d.timer += dt;
    const movement = this.entity.getComponent('movement');
    // タイマー上限 or 目的地到達で終了。位置の進行は Movement に任せている。
    if (d.timer >= d.duration || (movement && movement.hasArrived())) {
      this.dodge = null;
      // 回避明けは「その場待機」か「様子見」のどちらかに入る。
      // どちらも一瞬の硬直として機能し、被弾→即反撃の単調なループを崩す。
      if (Math.random() < 0.5) {
        this.startWait();
      } else {
        this.startReposition();
      }
    }
  }

  _tickReposition(dt) {
    this.reposition.timer -= dt;
    if (this.reposition.timer <= 0) this.reposition = null;
  }

  _tickWait(dt) {
    const w = this.wait;
    w.timer += dt;
    if (w.timer >= w.duration) {
      this.wait = null;
    }
  }

  _tickRest(dt) {
    const r = this.rest;
    r.timer += dt;
    const health = this.entity.getComponent('health');

    // 被弾検知: チェックポイントよりHPが減っていたら攻撃された → 休憩中断
    if (health && health.currentHealth < r.healthCheckpoint) {
      this._endRest();
      return;
    }
    if (health) r.healthCheckpoint = health.currentHealth;

    // 規定時間経過 or HP全快で終了
    if (r.timer >= r.duration || (health && health.currentHealth >= health.maxHealth)) {
      this._endRest();
    }
  }

  _endRest() {
    if (!this.rest) return;
    const health = this.entity.getComponent('health');
    if (health) health.regenRate = this.rest.originalRegenRate;
    this.rest = null;
  }

  // 脅威の知覚: 検出してから reactionTime 経つと shouldDodge() が true になる。
  _tickPerception(dt) {
    const threat = this.findIncomingAttack();
    if (threat) {
      if (!this.perceiving || this.perceiving.from !== threat) {
        this.perceiving = { from: threat, timer: this.reactionTime };
      } else {
        this.perceiving.timer -= dt;
      }
    } else {
      this.perceiving = null;
    }
  }

  _executeWindupAttack() {
    const w = this.windup;
    if (!w) return;
    const transform = this.entity.getComponent('transform');
    if (!transform) return;

    if (w.weapon.attackType === 'melee') {
      this.performMeleeAttack(transform, w.dirX, w.dirY, w.weapon);
    } else if (w.weapon.attackType === 'ranged') {
      this.performRangedAttack(transform, w.dirX, w.dirY, w.weapon);
    }
  }

  // 敵対関係にある相手のみダメージを通す。発射時点の関係性で固定するのではなく、
  // 着弾時に最新の関係性を参照する（飛翔中に敵対化/和解した場合に追従）。
  _buildHostileHitFilter() {
    const relationship = this.entity.getComponent('relationship');
    if (!relationship) return null;
    return (target) => relationship.isHostile(target);
  }

  performMeleeAttack(transform, dirX, dirY, weapon) {
    const dist = this.getMeleeHitboxDistance(weapon);
    const hitboxX = transform.x + dirX * dist;
    const hitboxY = transform.y + dirY * dist;

    const game = this.entity.game;
    const hitbox = createAttackHitbox(
      hitboxX,
      hitboxY,
      weapon.hitbox.radius,
      weapon.damage,
      this.entity,
      weapon.hitbox.duration,
      null,
      this._buildHostileHitFilter()
    );

    const useSlash = weapon.hitbox.visual === 'slash';
    if (useSlash && !DEBUG_SHOW_HITBOX_CIRCLE) {
      hitbox.removeComponent('shapeRenderer');
    }
    game.addEntity(hitbox);

    if (useSlash) {
      const slash = createSlashEffect(transform.x, transform.y, dirX, dirY, dist);
      game.addEntity(slash);
    }
  }

  performRangedAttack(transform, dirX, dirY, weapon) {
    const spawnDistance = 30;
    const startX = transform.x + dirX * spawnDistance;
    const startY = transform.y + dirY * spawnDistance;

    const game = this.entity.game;
    const hitbox = createAttackHitbox(
      startX,
      startY,
      weapon.projectile.radius,
      weapon.damage,
      this.entity,
      RANGE_TIERS[weapon.projectile.range] / weapon.projectile.speed,
      {
        dirX: dirX,
        dirY: dirY,
        speed: weapon.projectile.speed
      },
      this._buildHostileHitFilter()
    );
    game.addEntity(hitbox);
  }
}
