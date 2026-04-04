import { Game } from '../src/core/Game.js';
import { debug } from '../src/core/debug.js';
import { createHuman } from '../src/entities/Human.js';
import createItem from '../src/entities/Item.js';
import { createBuilding } from '../src/entities/Building.js';
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

// --- テスト1: 同じアイテムをaddするとスタックされる ---
console.log('\n[Test 1] 同じアイテム2個 → スタック');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const bread1 = createItem(0, 0, 'bread');
  game.addEntity(bread1);
  const bread2 = createItem(0, 0, 'bread');
  game.addEntity(bread2);

  const inv = human.getComponent('inventory');
  inv.add(bread1);
  inv.add(bread2);

  assert(inv.items.length === 1, `items.lengthが1 (実際: ${inv.items.length})`);
  assert(inv.items[0].getComponent('itemInfo').quantity === 2, `quantityが2 (実際: ${inv.items[0].getComponent('itemInfo').quantity})`);
}

// --- テスト2: スタック後もgame.entitiesにアイテムが残っている ---
console.log('\n[Test 2] スタック後もgame.entitiesに代表アイテムが残る');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const bread1 = createItem(0, 0, 'bread');
  game.addEntity(bread1);
  const bread2 = createItem(0, 0, 'bread');
  game.addEntity(bread2);

  const inv = human.getComponent('inventory');
  inv.add(bread1);
  inv.add(bread2);

  // markEntityForRemoval後、removeMarkedEntitiesで消える
  game.removeMarkedEntities();

  const remaining = inv.items[0];
  assert(game.entities.includes(remaining), '代表アイテムがgame.entitiesに存在する');
  assert(!game.entities.includes(bread2), 'マージされた方はgame.entitiesから消えている');
}

// --- テスト3: CarriedItemsFollowerがスタックアイテムにFollowOwnerを付ける ---
console.log('\n[Test 3] CarriedItemsFollowerがスタックアイテムを追従させる');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const bread1 = createItem(0, 0, 'bread');
  game.addEntity(bread1);
  const bread2 = createItem(0, 0, 'bread');
  game.addEntity(bread2);

  const inv = human.getComponent('inventory');
  inv.add(bread1);
  inv.add(bread2);
  game.removeMarkedEntities();

  // 1フレーム回してCarriedItemsFollowerを動かす
  runFrames(game, 1);

  const remaining = inv.items[0];
  const follow = remaining.getComponent('followOwner');
  assert(follow !== undefined, 'FollowOwnerが付与されている');
  assert(follow.owner === human, 'ownerがhumanを指している');
}

// --- テスト4: takeOneでスタックから1個取り出せる ---
console.log('\n[Test 4] takeOneでスタックから1個分離');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const bread1 = createItem(0, 0, 'bread');
  game.addEntity(bread1);
  const bread2 = createItem(0, 0, 'bread');
  game.addEntity(bread2);
  const bread3 = createItem(0, 0, 'bread');
  game.addEntity(bread3);

  const inv = human.getComponent('inventory');
  inv.add(bread1);
  inv.add(bread2);
  inv.add(bread3);
  game.removeMarkedEntities();

  assert(inv.items[0].getComponent('itemInfo').quantity === 3, 'スタック前: quantity=3');

  const taken = inv.takeOne(inv.items[0]);

  assert(taken !== null, 'takeOneがnullでない');
  assert(taken.getComponent('itemInfo').quantity === 1, '取り出したアイテムのquantity=1');
  assert(inv.items[0].getComponent('itemInfo').quantity === 2, 'スタック残り: quantity=2');
  assert(inv.items.length === 1, 'items.lengthは変わらず1');
}

// --- テスト5: quantity=1のときtakeOneでインベントリから消える ---
console.log('\n[Test 5] quantity=1のときtakeOneでインベントリから除去');
{
  const game = createGame();
  const human = createHuman(0, 0);
  game.addEntity(human);

  const bread = createItem(0, 0, 'bread');
  game.addEntity(bread);

  const inv = human.getComponent('inventory');
  inv.add(bread);

  const taken = inv.takeOne(bread);

  assert(taken === bread, '同じエンティティが返る');
  assert(inv.items.length === 0, 'インベントリが空になる');
}

// --- テスト6: Shop.buyで購入 → buyerのインベントリに入り追従する ---
console.log('\n[Test 6] Shop.buy → buyerのインベントリ & game.entities');
{
  const game = createGame();

  // 店を作成
  const shopEntity = createBuilding(0, 0, 'shop');
  game.addEntity(shopEntity);

  // 店を初期化（_spawnInitialItemsを走らせる）
  runFrames(game, 1);

  const shop = shopEntity.getComponent('shop');
  const shopInv = shopEntity.getComponent('inventory');
  const forSale = shop.getItemsForSale();
  assert(forSale.length > 0, `店にアイテムがある (${forSale.length}種類)`);

  const stackItem = forSale[0];
  const shopQuantityBefore = stackItem.getComponent('itemInfo').quantity;
  console.log(`    店のスタック: quantity=${shopQuantityBefore}`);

  // 人間を作成（コインを持たせる）
  const human = createHuman(100, 100);
  game.addEntity(human);
  const buyerInv = human.getComponent('inventory');
  const coins = createItem(100, 100, 'coin');
  coins.getComponent('itemInfo').quantity = 10;
  coins.getComponent('itemInfo').setOwner(human.id);
  game.addEntity(coins);
  buyerInv.add(coins);

  // 1個購入
  const result = shop.buy(stackItem, buyerInv);
  assert(result === true, 'buy()がtrueを返す');
  assert(buyerInv.items.length === 2, `buyerのitems.length=2 (実際: ${buyerInv.items.length})`);

  const boughtItem = buyerInv.items.find(e => e.getComponent('itemInfo')?.itemType === 'bread');
  assert(boughtItem !== undefined, 'buyerのインベントリにパンが存在する');
  assert(game.entities.includes(boughtItem), '購入アイテムがgame.entitiesに存在する');

  // さらに2個購入（同じスタックから）
  shop.buy(stackItem, buyerInv);
  shop.buy(stackItem, buyerInv);
  game.removeMarkedEntities();

  const breadItems = buyerInv.items.filter(e => e.getComponent('itemInfo')?.itemType === 'bread');
  assert(breadItems.length === 1, `パンがスタックされてbread=1 (実際: ${breadItems.length})`);
  assert(breadItems[0].getComponent('itemInfo').quantity === 3, `quantity=3 (実際: ${breadItems[0].getComponent('itemInfo').quantity})`);
  assert(game.entities.includes(breadItems[0]), '代表アイテムがgame.entitiesに残っている');

  // コインが減っているか
  const coinItem = buyerInv.items.find(e => e.getComponent('itemInfo')?.itemType === 'coin');
  assert(coinItem !== undefined, 'コインがまだインベントリにある');
  assert(coinItem.getComponent('itemInfo').quantity === 7, `コインが7枚残っている (実際: ${coinItem.getComponent('itemInfo').quantity})`);

  // CarriedItemsFollowerが動くか
  runFrames(game, 1);
  const follow = breadItems[0].getComponent('followOwner');
  assert(follow !== undefined, '購入アイテムにFollowOwnerが付いている');
  assert(follow.owner === human, 'ownerがhumanを指している');
}

// --- テスト7: Shop._spawnInitialItemsでスタックされるか確認 ---
console.log('\n[Test 7] 店の初期化で同種アイテムがスタックされる');
{
  const game = createGame();
  const shopEntity = createBuilding(0, 0, 'shop');
  game.addEntity(shopEntity);

  runFrames(game, 1);

  const shopInv = shopEntity.getComponent('inventory');
  console.log(`    店のitems.length: ${shopInv.items.length}`);
  console.log(`    先頭アイテムのquantity: ${shopInv.items[0]?.getComponent('itemInfo')?.quantity}`);

  // 全部breadなのでスタックされて1エンティティになるはず
  assert(shopInv.items.length === 1, `items.length=1 (実際: ${shopInv.items.length})`);
  assert(shopInv.items[0].getComponent('itemInfo').quantity >= 10, `quantity >= 10`);
}

// --- テスト8: 購入後runFramesして描画可能か確認 ---
console.log('\n[Test 8] 購入後フレーム進めて追従確認');
{
  const game = createGame();

  const shopEntity = createBuilding(200, 200, 'shop');
  game.addEntity(shopEntity);
  runFrames(game, 1);

  const human = createHuman(300, 300);
  game.addEntity(human);

  // コインを持たせる
  const coins8 = createItem(300, 300, 'coin');
  coins8.getComponent('itemInfo').quantity = 10;
  coins8.getComponent('itemInfo').setOwner(human.id);
  game.addEntity(coins8);
  human.getComponent('inventory').add(coins8);

  const shop = shopEntity.getComponent('shop');
  const buyerInv = human.getComponent('inventory');
  const forSale = shop.getItemsForSale();
  const stackItem = forSale[0];

  // 3個買う
  shop.buy(stackItem, buyerInv);
  shop.buy(stackItem, buyerInv);
  shop.buy(stackItem, buyerInv);

  // 数フレーム回す
  runFrames(game, 10);

  const item = buyerInv.items.find(e => e.getComponent('itemInfo')?.itemType === 'bread');
  assert(item !== undefined, 'インベントリにアイテムがある');
  assert(game.entities.includes(item), 'game.entitiesに含まれている');

  const itemTransform = item.getComponent('transform');
  const humanTransform = human.getComponent('transform');
  const dx = itemTransform.x - humanTransform.x;
  const dy = itemTransform.y - humanTransform.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  console.log(`    アイテム位置: (${itemTransform.x.toFixed(0)}, ${itemTransform.y.toFixed(0)})`);
  console.log(`    人間の位置: (${humanTransform.x.toFixed(0)}, ${humanTransform.y.toFixed(0)})`);
  console.log(`    距離: ${dist.toFixed(1)}`);
  assert(dist < 100, `アイテムが人間の近くにいる (距離=${dist.toFixed(1)})`);

  const itemInfo = item.getComponent('itemInfo');
  console.log(`    state: ${itemInfo.state}, quantity: ${itemInfo.quantity}, owner: ${itemInfo.owner}`);
  assert(itemInfo.state === 'owned', `stateがowned (実際: ${itemInfo.state})`);
  assert(itemInfo.quantity === 3, `quantity=3 (実際: ${itemInfo.quantity})`);
}

// --- 結果 ---
console.log(`\n${passed + failed}件中 ${passed}件成功、${failed}件失敗`);
if (failed > 0) process.exit(1);
