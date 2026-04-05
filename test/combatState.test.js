import { Game } from '../src/core/Game.js';
import { debug } from '../src/core/debug.js';
import { createHuman } from '../src/entities/Human.js';
import { createMonster } from '../src/entities/Monster.js';
import { PartyManager } from '../src/components/PartyManager.js';
import { CombatState } from '../src/states/CombatState.js';
import createItem from '../src/entities/Item.js';

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

function giveCoins(game, human, amount) {
  const t = human.getComponent('transform');
  const coin = createItem(t.x, t.y, 'coin');
  const info = coin.getComponent('itemInfo');
  info.quantity = amount;
  info.setOwner(human.id);
  game.addEntity(coin);
  human.getComponent('inventory').add(coin);
}

function setFull(human) {
  const nutrition = human.getComponent('nutrition');
  if (nutrition) nutrition.current = nutrition.max;
}

function currentStateName(entity) {
  return entity.getComponent('behavior')?.currentState?.constructor.name ?? 'null';
}

// --- テスト1: 敵が死んだらCombatStateを抜ける ---
console.log('\n[Test 1] 敵が死んだらCombatStateを抜ける');
{
  const game = createGame();

  const human = createHuman(0, 0);
  game.addEntity(human);

  const monster = createMonster(50, 0);
  game.addEntity(monster);

  // 直接CombatStateに入れてターゲットをセット
  const behavior = human.getComponent('behavior');
  const state = new CombatState();
  state.target = monster;
  behavior.changeState(state);

  assert(currentStateName(human) === 'CombatState', '初期状態がCombatState');

  // 敵を死亡させる
  monster.getComponent('health').isDead = true;

  runFrames(game, 1);

  assert(currentStateName(human) !== 'CombatState', `敵死亡後にCombatStateを抜ける (現在: ${currentStateName(human)})`);
}

// --- テスト2: 敵がchaseRange外に逃げたらCombatStateを抜ける ---
console.log('\n[Test 2] 敵がchaseRange外に逃げたらCombatStateを抜ける');
{
  const game = createGame();

  const human = createHuman(0, 0);
  game.addEntity(human);

  const monster = createMonster(0, 0);
  game.addEntity(monster);

  const combat = human.getComponent('combat');
  const behavior = human.getComponent('behavior');

  const state = new CombatState();
  state.target = monster;
  behavior.changeState(state);

  // 敵をchaseRange外に移動
  const monsterTransform = monster.getComponent('transform');
  monsterTransform.x = combat.chaseRange + 100;

  runFrames(game, 1);

  assert(currentStateName(human) !== 'CombatState', `敵逃亡後にCombatStateを抜ける (現在: ${currentStateName(human)})`);
}

// --- テスト3: パーティ支援ループ: chaseRange外の敵で1フレームでCombatStateを抜ける ---
// 修正前のバグ: DecisionState → パーティ支援でCombatState → chaseRange超え → DecisionState → ... (毎フレームループ)
// 修正後: chaseRange外の敵にはパーティ支援でCombatStateに入らず、別の状態に落ち着く
console.log('\n[Test 3] パーティ支援ループ: chaseRange外の敵で無限ループしない');
{
  const game = createGame();

  const human1 = createHuman(0, 0);
  const human2 = createHuman(0, 0);
  game.addEntity(human1);
  game.addEntity(human2);

  // パーティを組む
  const party1 = human1.getComponent('party');
  party1.form([human2]);

  // モンスターをhuman2のchaseRange外かつHUNT_RANGE(2000)外に配置
  const combat2 = human2.getComponent('combat');
  const monster = createMonster(combat2.chaseRange + 2100, 0);
  game.addEntity(monster);

  // human1をCombatStateに入れる（モンスターは遠いが生きている）
  const behavior1 = human1.getComponent('behavior');
  const combatState1 = new CombatState();
  combatState1.target = monster;
  behavior1.changeState(combatState1);

  // human2にコインと満腹状態を設定してHuntingState/BuyStateを回避
  giveCoins(game, human2, 20);
  setFull(human2);

  // human2をDecisionStateにする（パーティ支援チェックが走る）
  const { DecisionState } = await import('../src/states/DecisionState.js');
  const behavior2 = human2.getComponent('behavior');
  behavior2.changeState(new DecisionState());

  const stateAfter1Frame = currentStateName(human2);

  // 複数フレーム回しても状態が安定しているか（CombatState ↔ DecisionState のループでないか）
  runFrames(game, 10);
  const stateAfter10Frames = currentStateName(human2);

  assert(stateAfter1Frame !== 'CombatState', `1フレーム後: chaseRange外の敵にパーティ支援でCombatStateに入らない (現在: ${stateAfter1Frame})`);
  assert(stateAfter10Frames !== 'CombatState', `10フレーム後: 安定している (現在: ${stateAfter10Frames})`);
}

// --- テスト4: パーティ支援: 敵がchaseRange内ならCombatStateに入る ---
console.log('\n[Test 4] パーティ支援: 敵がchaseRange内ならCombatStateに入る');
{
  const game = createGame();

  const human1 = createHuman(0, 0);
  const human2 = createHuman(0, 0);
  game.addEntity(human1);
  game.addEntity(human2);

  const party1 = human1.getComponent('party');
  party1.form([human2]);

  // モンスターをchaseRange内に配置（コインと満腹でHuntingState/BuyState回避）
  giveCoins(game, human2, 20);
  setFull(human2);
  const combat2 = human2.getComponent('combat');
  const monster = createMonster(combat2.chaseRange - 50, 0);
  game.addEntity(monster);

  // human1をCombatStateにしてターゲットをモンスターに
  const behavior1 = human1.getComponent('behavior');
  const combatState1 = new CombatState();
  combatState1.target = monster;
  behavior1.changeState(combatState1);

  // human2のDecisionStateを実行（モンスターはchaseRange内）
  const { DecisionState } = await import('../src/states/DecisionState.js');
  const behavior2 = human2.getComponent('behavior');
  behavior2.changeState(new DecisionState());

  assert(currentStateName(human2) === 'CombatState', `chaseRange内の敵にはCombatStateに入る (現在: ${currentStateName(human2)})`);
}

// --- 結果 ---
console.log(`\n${passed + failed}件中 ${passed}件成功、${failed}件失敗`);
if (failed > 0) process.exit(1);
