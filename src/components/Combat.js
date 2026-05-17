import { createAttackHitbox } from '../entities/AttackHitbox.js';

// 逃走時に通常移動速度の何倍で動くか（防御的エンティティ用）
const FLEE_SPEED_MULTIPLIER = 3;

// 攻撃の予備動作を見てから回避を起動するまでの遅延 [秒]
// この値より windup が短い武器は反応できずに被弾する → 軽量武器が回避困難になる根拠
const REACTION_TIME = 0.25;

// 連続回避を防ぐクールダウン [秒]。回避完了から次の回避が許可されるまで
const DODGE_COOLDOWN = 2.0;

// 1回の回避でずれる距離 [ピクセル相当]
const DODGE_DISTANCE = 80;

// 回避モーションの所要時間 [秒]。短いほどステップが速く、攻撃を避けやすい
const DODGE_DURATION = 0.5;

// 武器の予備動作の長さ [秒]。武器側は 'fast'/'normal'/'slow' で指定し、実数はここで定義する。
// fast は REACTION_TIME(0.25) を下回るので回避困難 → 軽量武器の利点
const WINDUP_BY_SPEED = {
  fast: 0.5,
  normal: 1.0,
  slow: 1.5,
};
const DEFAULT_WINDUP_SPEED = 'normal';

// 体力がこの比率を下回ったら近接戦士も「低HP退避モード」に入る
const LOW_HP_THRESHOLD = 0.35;

// 遠隔武器のkite開始距離 = 武器射程 × この倍率。射程の半分まで近づかれたら離れる
const KITE_RANGE_RANGED = 0.5;

// 遠隔武器のkite停止距離 = 武器射程 × この倍率。ここまで離れたらkiteを止める
const KITE_STOP_RANGED = 0.9;

// 低HP近接の退避距離 [ピクセル相当]。武器射程に依存せず固定
const KITE_RANGE_LOW_HP_MELEE = 200;

// 低HP近接のkite停止距離 [ピクセル相当]
const KITE_STOP_LOW_HP_MELEE = 320;

export class Combat {
  constructor(shouldSeekCombat = false, detectionRange, chaseRange) {
    this.entity = null;
    this.shouldSeekCombat = shouldSeekCombat;
    this.cooldownTimer = 0;
    this.fleeSpeedMultiplier = FLEE_SPEED_MULTIPLIER;
    this.fleeStopMultiplier = 1.5;
    this.detectionRange = detectionRange;
    this.chaseRange = chaseRange ?? detectionRange * 1.5;
    this.windup = null;
    this.reactionTime = REACTION_TIME;
    this.dodgeCooldown = 0;
    this.perceiving = null;
    this.dodge = null;
    this.reposition = null;
  }

  isDodging() {
    return this.dodge !== null;
  }

  isRepositioning() {
    return this.reposition !== null;
  }

  // 様子見: 現在地から半径 radius 内のランダムな点に移動。
  // 攻撃クールダウン中などに揺さぶりとして発火させる想定。
  // 起動可否のうち「Combat自身しか知らない条件」だけここで守る。状況判断（確率など）は呼び出し側。
  startReposition(radius = 120, duration = 1.5) {
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

  _updateReposition(dt) {
    this.reposition.timer -= dt;
    if (this.reposition.timer <= 0) this.reposition = null;
  }

  // 攻撃の予備動作中は割り込み不可。
  // 新しい「割り込み不可な動作」を作るときは、ここに条件を足していく。
  isBusy() {
    return this.windup !== null;
  }

  // dirX, dirY は呼び出し側（CombatState）が決定した回避方向の単位ベクトル。
  // CombatState は「攻撃者→自分」のベクトルに対して垂直な方向を、左右ランダムに選んで渡す。
  // → 攻撃の軌道に対して横方向にステップするので、攻撃線から外れて被弾を避けられる。
  startDodge(dirX, dirY) {
    if (this.dodge || this.dodgeCooldown > 0) return false;
    if (this.isBusy()) return false;
    const transform = this.entity.getComponent('transform');
    if (!transform) return false;

    this.dodge = {
      startX: transform.x,
      startY: transform.y,
      targetX: transform.x + dirX * DODGE_DISTANCE,
      targetY: transform.y + dirY * DODGE_DISTANCE,
      timer: 0,
      duration: DODGE_DURATION,
    };
    this.dodgeCooldown = DODGE_COOLDOWN;
    transform.direction = Math.atan2(dirY, dirX);

    this.entity.getComponent('movement')?.stop();
    this.entity.getComponent('afterImage')?.trigger(DODGE_DURATION);
    return true;
  }

  _updateDodge(dt) {
    const d = this.dodge;
    d.timer += dt;
    const t = Math.min(d.timer / d.duration, 1);
    const transform = this.entity.getComponent('transform');
    if (transform) {
      transform.x = d.startX + (d.targetX - d.startX) * t;
      transform.y = d.startY + (d.targetY - d.startY) * t;
    }
    if (d.timer >= d.duration) {
      this.dodge = null;
    }
  }

  static createAggressive(detectionRange, chaseRange) {
    return new Combat(true, detectionRange, chaseRange);
  }

  static createDefensive(detectionRange, chaseRange) {
    return new Combat(false, detectionRange, chaseRange);
  }

  // 近接武器のヒットボックス中心までの距離。
  // 自分の collider 円と武器の hitbox 円が外接するように置く（自分のサイズ + 武器の半径）。
  getMeleeHitboxDistance(weapon) {
    const collider = this.entity.getComponent('collider');
    const ownRadius = collider?.shape?.type === 'circle' ? collider.shape.radius : 0;
    return ownRadius + weapon.hitbox.radius;
  }

  getWeaponRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 50;

    const weapon = equipment.getWeapon();
    if (weapon.attackType === 'melee') {
      return this.getMeleeHitboxDistance(weapon) + weapon.hitbox.radius;
    } else {
      return weapon.projectile.speed * weapon.projectile.duration;
    }
  }

  // 接近されたときに離れたい内側の距離。0なら離れない
  getKiteRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 0;
    const weapon = equipment.getWeapon();

    if (weapon.attackType === 'ranged') {
      return this.getWeaponRange() * KITE_RANGE_RANGED;
    }

    const health = this.entity.getComponent('health');
    if (health && health.maxHealth > 0 && health.currentHealth / health.maxHealth < LOW_HP_THRESHOLD) {
      return KITE_RANGE_LOW_HP_MELEE;
    }
    return 0;
  }

  // kiteを解除する外側の距離。ヒステリシスで「離れる→止まる→近づかれる→離れる」の反復を防ぐ
  getKiteStopRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 0;
    const weapon = equipment.getWeapon();

    if (weapon.attackType === 'ranged') {
      return this.getWeaponRange() * KITE_STOP_RANGED;
    }

    const health = this.entity.getComponent('health');
    if (health && health.maxHealth > 0 && health.currentHealth / health.maxHealth < LOW_HP_THRESHOLD) {
      return KITE_STOP_LOW_HP_MELEE;
    }
    return 0;
  }

  canAttack() {
    return this.cooldownTimer <= 0 && !this.windup;
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
      weapon.hitbox.duration
    );
    game.addEntity(hitbox);
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
      weapon.projectile.duration,
      {
        dirX: dirX,
        dirY: dirY,
        speed: weapon.projectile.speed
      }
    );
    game.addEntity(hitbox);
  }

  // 自分を狙っている、windup中の敵
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

  // 回避すべきならその発生源を返す。完了後にリセットされる
  consumeDodgePlan() {
    if (this.dodge) return null;
    if (!this.perceiving) return null;
    if (this.perceiving.timer > 0) return null;
    if (this.dodgeCooldown > 0) return null;
    const from = this.perceiving.from;
    this.perceiving = null;
    return from;
  }

  update() {
    const game = this.entity.game;
    const dt = game.deltaTime;

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown -= dt;
    }

    if (this.windup) {
      this.windup.timer -= dt;
      if (this.windup.timer <= 0) {
        this._executeWindupAttack();
        this.windup = null;
      }
    }

    if (this.dodge) {
      this._updateDodge(dt);
    }

    if (this.reposition) {
      this._updateReposition(dt);
    }

    // 脅威の知覚: 検出してから reactionTime 経つと回避発動
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
}
