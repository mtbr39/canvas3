import { DecisionState } from './DecisionState.js';

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
    if (!this.target) this.findTarget(entity);
    entity.getComponent('party')?.clearDestination();
    const movement = entity.getComponent('movement');
    const combat = entity.getComponent('combat');
    if (movement && combat && !combat.shouldSeekCombat) {
      this.originalSpeed = movement.speed;
      movement.speed = movement.speed * combat.fleeSpeedMultiplier;
    }
    movement?.stop();
  }

  getTarget() {
    if (!this.target) return null;
    const health = this.target.getComponent('health');
    if (!health || health.isDead) return null;
    return this.target;
  }

  findTarget(entity) {
    const combat = entity.getComponent('combat');
    this.target = combat ? combat.findNearbyEnemy() : null;
  }

  update(entity) {
    const game = entity.game;
    const combat = entity.getComponent('combat');
    const transform = entity.getComponent('transform');
    const movement = entity.getComponent('movement');
    const behavior = entity.getComponent('behavior');

    if (!combat || !transform || !movement || !behavior) return;

    // 回避中は他の行動を抑止
    if (combat.isDodging()) return;

    // 回避判定: 反応時間が満ちて回避クールダウンも明けていれば回避を起動
    const dodgeFrom = combat.consumeDodgePlan();
    if (dodgeFrom) {
      const fromT = dodgeFrom.getComponent('transform');
      if (fromT) {
        // 攻撃者→自分の方向ベクトル (dx, dy) を求め、それに垂直な単位ベクトルを作る。
        // 2D で (dx, dy) に垂直なのは (-dy, dx) と (dy, -dx) の2つ → どちらに避けるかは sign でランダムに選ぶ。
        // 結果として「攻撃の軌道線に対して真横」へステップする向きが決まる。
        const dx = transform.x - fromT.x;
        const dy = transform.y - fromT.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const sign = Math.random() < 0.5 ? 1 : -1;
        const perpX = -dy / d * sign;
        const perpY = dx / d * sign;
        if (combat.startDodge(perpX, perpY)) return;
      }
    }

    // Periodically recheck for targets
    this.checkTimer += game.deltaTime;
    if (this.checkTimer >= this.checkInterval) {
      this.checkTimer = 0;
      this.findTarget(entity);
    }

    // No valid target - return to decision
    const target = this.getTarget();
    if (!target) {
      behavior.changeState(this.returnState ?? new DecisionState());
      return;
    }

    // Target fled too far
    const dist = game.spatialQuery.getDistance(entity, target);
    if (this.isAllyTarget) {
      if (dist > combat.joinAllyRange) {
        // joinAllyRangeまで近づき続ける
        const targetTransform = target.getComponent('transform');
        movement.moveTo(targetTransform.x, targetTransform.y);
        return;
      }
      // 十分近づいたら通常の戦闘/逃走ロジックへ
      this.isAllyTarget = false;
    }
    const stopRange = combat.shouldSeekCombat
      ? combat.chaseRange
      : (target.getComponent('combat')?.chaseRange ?? combat.chaseRange) * combat.fleeStopMultiplier;
    if (dist > stopRange) {
      behavior.changeState(this.returnState ?? new DecisionState());
      return;
    }

    const targetTransform = target.getComponent('transform');
    if (!targetTransform) {
      behavior.changeState(this.returnState ?? new DecisionState());
      return;
    }

    // Calculate center-to-center distance
    const centerDistance = game.spatialQuery.getDistance(entity, target);

    if (!combat.shouldSeekCombat) {
      const fleeDestination = this.getFleeDestination(entity, targetTransform);
      movement.moveTo(fleeDestination.x, fleeDestination.y);
      return;
    }

    const weaponRange = combat.getWeaponRange();
    const kiteRange = combat.getKiteRange();

    // ヒステリシス: 離脱開始の閾値(kiteRange)と離脱解除の閾値(kiteRange * 1.6)を分け、
    // 境界付近で「離れる→止まる→近づかれる→離れる」という反復が起きないようにする。
    // 1.6 はチューニング値: 大きいほど離脱を長く続ける（粘る）、小さいほど早く戦闘距離に戻る。
    if (kiteRange > 0) {
      if (centerDistance < kiteRange) this.kiting = true;
      else if (centerDistance > kiteRange * 1.6) this.kiting = false;
    } else {
      this.kiting = false;
    }

    // 近すぎる場合は離れながら攻撃する
    if (this.kiting) {
      const dx = transform.x - targetTransform.x;
      const dy = transform.y - targetTransform.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      // 敵から離れる方向に毎フレーム新しい移動先を再計算するので、
      // 「現在地から KITE_DISTANCE 先」に向かって連続的に後退し続ける。
      // 値はピクセル相当。大きいほど一回の指示で長く下がるが、毎フレーム上書きされるので実効的には方向ベクトル。
      const KITE_DISTANCE = 150;
      movement.moveTo(
        transform.x + (dx / d) * KITE_DISTANCE,
        transform.y + (dy / d) * KITE_DISTANCE
      );
      if (centerDistance <= weaponRange && combat.canAttack()) {
        combat.attack(target);
      }
      return;
    }

    // Within weapon range - try to attack
    if (centerDistance <= weaponRange) {
      movement.stop();
      if (combat.canAttack()) {
        combat.attack(target);
      }
    } else {
      // Move closer to get within weapon range
      movement.moveTo(targetTransform.x, targetTransform.y);
    }
  }

  getFleeDestination(entity, targetTransform) {
    const FLEE_DISTANCE = 200;
    const ALLY_PROXIMITY_THRESHOLD = 1000;
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

  exit(entity) {
    const movement = entity.getComponent('movement');
    if (movement) {
      movement.stop();
      if (this.originalSpeed !== undefined) {
        movement.speed = this.originalSpeed;
        this.originalSpeed = undefined;
      }
    }
    this.target = null;
  }
}
