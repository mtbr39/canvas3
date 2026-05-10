import { createAttackHitbox } from '../entities/AttackHitbox.js';

// 逃走時に通常移動速度の何倍で動くか（防御的エンティティ用）
const FLEE_SPEED_MULTIPLIER = 3;

// 攻撃の予備動作を見てから回避を起動するまでの遅延 [秒]
// この値より windup が短い武器は反応できずに被弾する → 軽量武器が回避困難になる根拠
const REACTION_TIME = 0.25;

// 連続回避を防ぐクールダウン [秒]。回避完了から次の回避が許可されるまで
const DODGE_COOLDOWN = 1.0;

// 1回の回避でずれる距離 [ピクセル相当]
const DODGE_DISTANCE = 80;

// 回避モーションの所要時間 [秒]。短いほど無敵時間も短い
const DODGE_DURATION = 0.2;

// 体力がこの比率を下回ったら近接戦士も「低HP退避モード」に入る
const LOW_HP_THRESHOLD = 0.35;

// 遠隔武器のkite開始距離 = 武器射程 × この倍率。射程の半分まで近づかれたら離れる
const KITE_RANGE_RANGED = 0.5;

// 低HP近接の退避距離 = 武器射程 × この倍率。1.2倍 → 武器射程よりやや外まで下がる
const KITE_RANGE_LOW_HP_MELEE = 1.2;

export class Combat {
  constructor(shouldSeekCombat = false, detectionRange, chaseRange) {
    this.entity = null;
    this.shouldSeekCombat = shouldSeekCombat;
    this.cooldownTimer = 0;
    this.fleeSpeedMultiplier = FLEE_SPEED_MULTIPLIER;
    this.fleeStopMultiplier = 3.0;
    this.detectionRange = detectionRange;
    this.chaseRange = chaseRange ?? detectionRange * 1.5;
    this.joinAllyRange = this.chaseRange * 1.5;
    this.windup = null;
    this.reactionTime = REACTION_TIME;
    this.dodgeCooldown = 0;
    this.perceiving = null;
    this.dodge = null;
  }

  isDodging() {
    return this.dodge !== null;
  }

  // dirX, dirY は呼び出し側（CombatState）が決定した回避方向の単位ベクトル。
  // CombatState は「攻撃者→自分」のベクトルに対して垂直な方向を、左右ランダムに選んで渡す。
  // → 攻撃の軌道に対して横方向にステップするので、攻撃線から外れて被弾を避けられる。
  startDodge(dirX, dirY) {
    if (this.dodge || this.dodgeCooldown > 0) return false;
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
    this.entity.getComponent('floatingText')?.show('回避');
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

  getAttackRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 100;

    const weapon = equipment.getWeapon();
    return weapon.attackType === 'ranged' ? 250 : 150;
  }

  getWeaponRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 50;

    const weapon = equipment.getWeapon();
    if (weapon.attackType === 'melee') {
      return weapon.hitbox.distance + weapon.hitbox.radius;
    } else {
      return weapon.projectile.speed * weapon.projectile.duration;
    }
  }

  // 接近されたときに離れたい内側の距離。0なら離れない
  getKiteRange() {
    const equipment = this.entity.getComponent('equipment');
    if (!equipment) return 0;
    const weapon = equipment.getWeapon();
    const baseRange = this.getWeaponRange();

    if (weapon.attackType === 'ranged') {
      return baseRange * KITE_RANGE_RANGED;
    }

    const health = this.entity.getComponent('health');
    if (health && health.maxHealth > 0 && health.currentHealth / health.maxHealth < LOW_HP_THRESHOLD) {
      return baseRange * KITE_RANGE_LOW_HP_MELEE;
    }
    return 0;
  }

  canAttack() {
    return this.cooldownTimer <= 0 && !this.windup;
  }

  findNearbyEnemy() {
    const transform = this.entity.getComponent('transform');
    if (!transform) return null;

    const game = this.entity.game;
    const tag = this.entity.getComponent('tag');
    const enemyTag = tag?.hasTag('human') ? 'monster' : 'human';

    const nearbyEnemies = game.spatialQuery.findNearbyByTag(
      game.entities, transform.x, transform.y, this.detectionRange, enemyTag
    );

    for (const result of nearbyEnemies) {
      const health = result.entity.getComponent('health');
      if (health && !health.isDead) {
        return result.entity;
      }
    }

    return null;
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

    const windupDuration = weapon.windup ?? 0.2;

    this.windup = {
      weapon,
      target: targetEntity,
      dirX,
      dirY,
      timer: windupDuration,
      duration: windupDuration,
    };
    this.cooldownTimer = windupDuration + weapon.cooldown;

    const floatingText = this.entity.getComponent('floatingText');
    if (floatingText) {
      floatingText.show(weapon.name);
    }

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
    const hitboxX = transform.x + dirX * weapon.hitbox.distance;
    const hitboxY = transform.y + dirY * weapon.hitbox.distance;

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
    const tag = this.entity.getComponent('tag');
    const enemyTag = tag?.hasTag('human') ? 'monster' : 'human';

    const nearby = game.spatialQuery.findNearbyByTag(
      game.entities, transform.x, transform.y, this.detectionRange, enemyTag
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
