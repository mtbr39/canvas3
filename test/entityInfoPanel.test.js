import { Game } from '../src/core/Game.js';
import { createHuman } from '../src/entities/Human.js';
import { PartyManager } from '../src/components/PartyManager.js';
import { EntityInfoPanel } from '../src/components/EntityInfoPanel.js';
import createItem from '../src/entities/Item.js';
import { give } from '../src/components/ItemExchanger.js';

function createGame() {
  const game = new Game();
  game.register('partyManager', new PartyManager());
  return game;
}

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

// --- テスト1: findHumanAt がクリック半径内の human を返す ---
console.log('\n[Test 1] findHumanAt: 半径内にいる human を返す');
{
  const game = createGame();
  const human = createHuman(100, 100);
  game.addEntity(human);

  const panel = new EntityInfoPanel();
  game.register('entityInfoPanel', panel);

  const found = panel.findHumanAt(100, 100);
  assert(found === human, 'クリック中心に human がいる → 見つかる');

  const foundNear = panel.findHumanAt(130, 100);
  assert(foundNear === human, '30px離れていても半径内なら見つかる');

  const notFound = panel.findHumanAt(200, 100);
  assert(notFound === null, '遠い場所 → null');
}

// --- テスト2: buildContent が health/nutrition/vitality の情報を含む ---
console.log('\n[Test 2] buildContent: エンティティの情報が含まれる');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const panel = new EntityInfoPanel();
  game.register('entityInfoPanel', panel);

  const html = panel.buildContent(human);
  assert(html.includes('HP'), 'HP が含まれる');
  assert(html.includes('栄養'), '栄養が含まれる');
  assert(html.includes('気力'), '気力が含まれる');
}

// --- テスト3: 冒険者と村人で種別が変わる ---
console.log('\n[Test 3] buildContent: 冒険者 / 村人の判別');
{
  const game = createGame();

  // equipment を持つ = 冒険者
  let adventurer = null;
  let villager = null;
  for (let i = 0; i < 20; i++) {
    const h = createHuman(0, 0);
    game.addEntity(h);
    if (!adventurer && h.getComponent('equipment')) adventurer = h;
    if (!villager && !h.getComponent('equipment')) villager = h;
    if (adventurer && villager) break;
  }

  const panel = new EntityInfoPanel();
  game.register('entityInfoPanel', panel);

  if (adventurer) {
    const html = panel.buildContent(adventurer);
    assert(html.includes('冒険者'), '冒険者ラベルが含まれる');
  }
  if (villager) {
    const html = panel.buildContent(villager);
    assert(html.includes('村人'), '村人ラベルが含まれる');
  }
}

// --- テスト4: コインを持つ human のインベントリが表示される ---
console.log('\n[Test 4] buildContent: インベントリの内容が含まれる');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const panel = new EntityInfoPanel();
  game.register('entityInfoPanel', panel);

  const inventory = human.getComponent('inventory');
  const coin = createItem(0, 0, 'coin');
  game.addEntity(coin);
  give(coin, inventory);

  assert(inventory.getCount() > 0, 'コインを追加した');

  const html = panel.buildContent(human);
  assert(html.includes('coin'), 'coin がインベントリ欄に含まれる');
}

// --- 結果 ---
console.log(`\n${passed + failed}件中 ${passed}件成功、${failed}件失敗`);
if (failed > 0) process.exit(1);
