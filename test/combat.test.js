// Combat コンポーネントの「条件メソッド × アクションメソッド」のテスト。
// 状況判断 (CombatState 側) を経由せず、Combat の API 単体を確認する。

import { Game } from '../src/core/Game.js';
import { debug } from '../src/core/debug.js';
import { createHuman } from '../src/entities/Human.js';
import { createMonster } from '../src/entities/Monster.js';
import { PartyManager } from '../src/components/PartyManager.js';

function createGame() {
  const game = new Game();
  game.register('partyManager', new PartyManager());
  return game;
}

debug.enabled = false;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function runFrames(game, frames, dt = 0.1) {
  for (let i = 0; i < frames; i++) game.update(dt);
}

// --- 状態クエリ (conditions) -------------------------------------

console.log('\n[Test] isLowHp: HPがしきい値以下で true');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const combat = human.getComponent('combat');
  const health = human.getComponent('health');

  health.currentHealth = health.maxHealth;
  assert(combat.isLowHp() === false, '満タンでは isLowHp = false');

  // しきい値は 0.35 (Combat.js 内)
  health.currentHealth = health.maxHealth * 0.5;
  assert(combat.isLowHp() === false, '50%では isLowHp = false');

  health.currentHealth = health.maxHealth * 0.2;
  assert(combat.isLowHp() === true, '20%では isLowHp = true');
}

console.log('\n[Test] isBusy / canAttack: windup中は両方の条件が同時に動く');
{
  const game = createGame();
  // Monster は必ず melee の equipment と aggressive combat を持つ → 攻撃側に使う
  const attacker = createMonster(0, 0);
  const target = createHuman(40, 0);
  game.addEntity(attacker);
  game.addEntity(target);

  const combat = attacker.getComponent('combat');

  assert(combat.isBusy() === false, '初期は isBusy = false');
  assert(combat.canAttack() === true, '初期は canAttack = true');

  const started = combat.attack(target);
  assert(started === true, 'attack() が起動成功');
  assert(combat.isBusy() === true, 'windup中は isBusy = true');
  assert(combat.canAttack() === false, 'windup中は canAttack = false');

  // もう一度 attack() しても起動しない（canAttack=false で守られている）
  const again = combat.attack(target);
  assert(again === false, 'windup中の二重 attack は拒否');
}

console.log('\n[Test] startDodge: isBusy / dodgeCooldown で起動拒否');
{
  const game = createGame();
  const monster = createMonster(0, 0);
  game.addEntity(monster);

  const combat = monster.getComponent('combat');

  // 1回目: 起動できる
  assert(combat.startDodge(1, 0) === true, '初期状態では startDodge 成功');
  assert(combat.isDodging() === true, 'isDodging = true');

  // 回避中は新たな startDodge を拒否
  assert(combat.startDodge(0, 1) === false, '回避中の startDodge は拒否');

  // 回避完了直後（クールダウンはまだ残っている）
  while (combat.isDodging()) game.update(0.1);
  assert(combat.dodgeCooldown > 0, '回避完了直後はクールダウン残り > 0');
  assert(combat.startDodge(1, 0) === false, '回避クールダウン中は startDodge 拒否');
}

console.log('\n[Test] startRest: isBusy / isDodging / isRepositioning で起動拒否');
{
  const game = createGame();
  const attacker = createMonster(0, 0);
  const target = createHuman(40, 0);
  game.addEntity(attacker);
  game.addEntity(target);

  const combat = attacker.getComponent('combat');

  // windup中は startRest 拒否
  combat.attack(target);
  assert(combat.isBusy() === true, 'windup起動');
  assert(combat.startRest() === false, 'isBusy 中の startRest は拒否');

  // windup を消化
  while (combat.windup) game.update(0.1);

  // dodge中は拒否
  combat.startDodge(1, 0);
  assert(combat.isDodging() === true, 'dodge起動');
  assert(combat.startRest() === false, 'isDodging 中の startRest は拒否');

  // dodge完了後は起動できる（cooldownはrestに影響しない）
  while (combat.isDodging()) game.update(0.1);
  assert(combat.startRest() === true, '通常状態では startRest 成功');
  assert(combat.isResting() === true, 'isResting = true');
}

// --- 距離クエリ (conditions) -------------------------------------

console.log('\n[Test] getKiteRange: 近接×通常HP では 0、近接×低HP では正の値');
{
  const game = createGame();
  // Monster は必ず melee なので melee の挙動を検証できる
  const monster = createMonster(0, 0);
  game.addEntity(monster);

  const combat = monster.getComponent('combat');
  const health = monster.getComponent('health');

  health.currentHealth = health.maxHealth;
  assert(combat.getKiteRange() === 0, '満HPの近接は kiteしない (0)');

  health.currentHealth = health.maxHealth * 0.2;
  assert(combat.getKiteRange() > 0, '低HPの近接は kite距離が正');
  assert(combat.getKiteStopRange() > combat.getKiteRange(), 'kiteStop > kiteRange (ヒステリシス)');
}

// --- 索敵クエリ (conditions) -------------------------------------

console.log('\n[Test] findIncomingAttack: 敵がこちらにwindup中なら検出');
{
  const game = createGame();
  const me = createHuman(0, 0);
  const enemy = createMonster(30, 0);  // Monster は aggressive + melee で常に攻撃可能
  game.addEntity(me);
  game.addEntity(enemy);

  const myCombat = me.getComponent('combat');
  const enemyCombat = enemy.getComponent('combat');

  assert(myCombat.findIncomingAttack() === null, '何もない時は null');

  // 敵がこちらに攻撃を仕掛ける
  enemyCombat.attack(me);
  assert(myCombat.findIncomingAttack() === enemy, 'windup中の敵を検出');
}

console.log('\n[Test] shouldDodge / consumeDodgePlan: 反応時間 + クールダウンの両方が条件');
{
  const game = createGame();
  const me = createHuman(0, 0);
  const enemy = createMonster(30, 0);
  game.addEntity(me);
  game.addEntity(enemy);

  const myCombat = me.getComponent('combat');
  const enemyCombat = enemy.getComponent('combat');

  // 敵が攻撃開始 → 知覚タイマースタート
  enemyCombat.attack(me);
  game.update(0.05); // reactionTime(0.25) より短い
  assert(myCombat.shouldDodge() === false, '反応時間前は shouldDodge = false');

  // 反応時間を超過させる
  game.update(0.3);
  assert(myCombat.shouldDodge() === true, '反応時間後は shouldDodge = true');

  // consume すれば内部状態がクリアされる
  const from = myCombat.consumeDodgePlan();
  assert(from === enemy, 'consumeDodgePlan が攻撃者を返す');
  assert(myCombat.shouldDodge() === false, 'consume後は shouldDodge = false');
}

// --- アクション結果 -------------------------------------

console.log('\n[Test] startRest: HP再生を一時的にブーストし、被弾で中断する');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const combat = human.getComponent('combat');
  const health = human.getComponent('health');
  const originalRegen = health.regenRate;

  // HPを少し減らす（regenを観察するため）
  health.currentHealth = health.maxHealth - 50;

  assert(combat.startRest() === true, '休憩起動');
  assert(health.regenRate > originalRegen, '休憩中は regenRate がブーストされる');

  // 被弾シミュレーション: HPを直接減らす
  game.update(0.1);
  health.currentHealth -= 10;
  game.update(0.1);
  assert(combat.isResting() === false, '被弾で休憩中断');
  assert(health.regenRate === originalRegen, 'regenRate が元に戻る');
}

// --- 結果 ---
console.log(`\n${passed + failed}件中 ${passed}件成功、${failed}件失敗`);
if (failed > 0) process.exit(1);
