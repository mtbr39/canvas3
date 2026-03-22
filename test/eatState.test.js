import { Game } from '../src/core/Game.js';
import { debug } from '../src/core/debug.js';
import { createHuman } from '../src/entities/Human.js';
import createItem from '../src/entities/Item.js';
import { EatState } from '../src/states/EatState.js';
import { PartyManager } from '../src/components/PartyManager.js';

function createGame() {
  const game = new Game();
  game.register('partyManager', new PartyManager());
  return game;
}

debug.enabled = true;

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

function runFrames(game, frames, dt = 0.5) {
  for (let i = 0; i < frames; i++) game.update(dt);
}

// --- テスト1: 食料あり・空腹 → cookingフェーズ ---
console.log('\n[Test 1] 食料あり・空腹 → cooking');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const meat = createItem(0, 0, 'meat');
  human.getComponent('inventory').add(meat);
  human.getComponent('nutrition').current = 10;

  runFrames(game, 10);

  const state = human.getComponent('behavior').currentState;
  assert(state instanceof EatState, 'EatStateに入っている');
  assert(state.phase === 'cooking', 'cookingフェーズである');
}

// --- テスト2: 食料なし・空腹 → EatStateに入らない ---
console.log('\n[Test 2] 食料なし・空腹 → EatStateに入らない');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  human.getComponent('nutrition').current = 10;

  runFrames(game, 10);

  const state = human.getComponent('behavior').currentState;
  assert(!(state instanceof EatState), 'EatStateに入っていない');
}

// --- テスト3: 調理完成 → 近くのwaitingメンバーに配膳される ---
console.log('\n[Test 3] 調理完成 → waitingメンバーへ配膳');
{
  const game = createGame();

  // 調理担当（食料あり・空腹）
  const cook = createHuman(0, 0);
  game.addEntity(cook);
  const meat = createItem(0, 0, 'meat');
  cook.getComponent('inventory').add(meat);
  cook.getComponent('nutrition').current = 10;

  // 待機担当（食料なし・空腹、近くに配置）
  const waiter = createHuman(50, 0);
  game.addEntity(waiter);
  waiter.getComponent('nutrition').current = 10;
  const initialNutrition = waiter.getComponent('nutrition').current;

  // パーティを組む
  cook.getComponent('party').form([waiter]);

  // cook が cooking に入るまで
  runFrames(game, 10);
  const cookState = cook.getComponent('behavior').currentState;
  assert(cookState instanceof EatState && cookState.phase === 'cooking', 'cookがcooking中');

  // 調理完成まで待つ（cookingTime=5s + α）
  runFrames(game, 20);

  // 配膳されたか確認（初期値10より増えているはず）
  const nutritionAfter = waiter.getComponent('nutrition').current;
  assert(nutritionAfter > initialNutrition, `配膳されて栄養が増えた (${initialNutrition.toFixed(1)} → ${nutritionAfter.toFixed(1)})`);
}

// --- 結果 ---
console.log(`\n${passed + failed}件中 ${passed}件成功、${failed}件失敗`);
if (failed > 0) process.exit(1);
