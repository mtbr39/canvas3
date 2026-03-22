// HomeState中に食料あり・空腹でもSoloMove↔Homeをループする現象の再現テスト
import { Game } from '../src/core/Game.js';
import { debug } from '../src/core/debug.js';
import { createHuman } from '../src/entities/Human.js';
import createItem from '../src/entities/Item.js';
import { EatState } from '../src/states/EatState.js';
import { HomeState } from '../src/states/HomeState.js';
import { SoloMoveToState } from '../src/states/SoloMoveToState.js';
import { DecisionState } from '../src/states/DecisionState.js';
import { PartyManager } from '../src/components/PartyManager.js';
import { Entity } from '../src/core/Entity.js';
import { Transform } from '../src/components/Transform.js';
import { Collider } from '../src/components/Collider.js';

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

function createGame() {
  const game = new Game();
  game.register('partyManager', new PartyManager());
  return game;
}

function createHome(x = 0, y = 0) {
  const home = new Entity();
  home.addComponent('transform', new Transform(x, y));
  home.addComponent('collider', new Collider({ type: 'rect', width: 100, height: 100 }));
  return home;
}

function runFrames(game, frames, dt = 0.5) {
  for (let i = 0; i < frames; i++) game.update(dt);
}

function getStateName(entity) {
  return entity.getComponent('behavior').currentState?.constructor.name ?? 'null';
}

// --- テスト1: HomeState中に食料あり・空腹 → EatStateへ遷移するか ---
console.log('\n[Test 1] HomeState中 + 食料あり + 空腹 → EatStateへ遷移');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  // 家を設定
  const home = createHome(0, 0);
  human.getComponent('resident').home = home;

  // 食料と空腹を設定
  const meat = createItem(0, 0, 'meat');
  human.getComponent('inventory').add(meat);
  human.getComponent('nutrition').current = 0;

  // HomeStateに直接遷移
  human.getComponent('behavior').changeState(new HomeState());

  console.log(`  初期state: ${getStateName(human)}`);
  runFrames(game, 5);
  console.log(`  5フレーム後: ${getStateName(human)}`);

  const state = human.getComponent('behavior').currentState;
  assert(state instanceof EatState, 'EatStateに遷移している');
}

// --- テスト2: DecisionState中に食料あり・空腹・家あり → EatStateへ（SoloMoveではなく） ---
console.log('\n[Test 2] DecisionState + 食料あり + 空腹 + 家あり → EatState（SoloMoveにならない）');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const home = createHome(200, 200);
  human.getComponent('resident').home = home;

  const meat = createItem(0, 0, 'meat');
  human.getComponent('inventory').add(meat);
  human.getComponent('nutrition').current = 0;

  // DecisionStateに直接遷移（enter()が即決定する）
  human.getComponent('behavior').changeState(new DecisionState());

  console.log(`  DecisionState直後: ${getStateName(human)}`);

  const state = human.getComponent('behavior').currentState;
  assert(state instanceof EatState, 'EatStateに遷移している（SoloMoveToStateではない）');
  assert(!(state instanceof SoloMoveToState), 'SoloMoveToStateになっていない');
}

// --- テスト3: SoloMove(→Home)到着後に食料あり・空腹 → HomeStateを経由してEatStateへ ---
console.log('\n[Test 3] SoloMove(→Home)到着 + 食料あり + 空腹 → HomeState経由でEatState');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  // 家は遠い（100,0）
  const home = createHome(100, 0);
  human.getComponent('resident').home = home;

  const meat = createItem(0, 0, 'meat');
  human.getComponent('inventory').add(meat);
  human.getComponent('nutrition').current = 0;

  // SoloMoveToState(→HomeState)に遷移
  human.getComponent('behavior').changeState(new SoloMoveToState(100, 0, new HomeState()));

  console.log(`  開始: ${getStateName(human)}`);

  // 移動+HomeState滞在をシミュレート（十分なフレーム）
  for (let i = 0; i < 30; i++) {
    game.update(0.5);
    const name = getStateName(human);
    if (name === 'EatState') {
      console.log(`  ${i+1}フレーム目でEatStateへ到達`);
      break;
    }
  }

  console.log(`  30フレーム後: ${getStateName(human)}`);
  const state = human.getComponent('behavior').currentState;
  assert(state instanceof EatState, 'EatStateに到達している');
}

// --- 結果 ---
console.log(`\n${passed + failed}件中 ${passed}件成功、${failed}件失敗`);
if (failed > 0) process.exit(1);
