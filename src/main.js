import { Game } from './core/Game.js';
import { PartyManager } from './components/PartyManager.js';
import { MonsterSpawner } from './components/MonsterSpawner.js';
import { EntityInfoPanel } from './components/EntityInfoPanel.js';
import { createHumanParty } from './entities/Human.js';
import { createMonster, createBoss } from './entities/Monster.js';
import createItem from './entities/Item.js';
import { createLocation } from './entities/Location.js';
import { generateWorld } from './world/generateWorld.js';
import { createGrassBackground } from './entities/GrassBackground.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

game.register('partyManager', new PartyManager());
// game.register('monsterSpawner', new MonsterSpawner());

const entityInfoPanel = new EntityInfoPanel();
game.register('entityInfoPanel', entityInfoPanel);
entityInfoPanel.setup();

console.log('v0323');

const WORLD_WIDTH = 8000;
const WORLD_HEIGHT = 4000;
const HUMAN_COUNT = 30;
const MONSTER_COUNT = 30;
const BOSS_COUNT = 3;

let humanCount = 0;
while (humanCount < HUMAN_COUNT) {
  const size = Math.min(Math.floor(Math.random() * 4) + 1, HUMAN_COUNT - humanCount);
  const x = (Math.random() - 0.5) * WORLD_WIDTH;
  const y = (Math.random() - 0.5) * WORLD_HEIGHT;
  createHumanParty(game, x, y, size);
  humanCount += size;
}

// for (let i = 0; i < MONSTER_COUNT; i++) {
//   const x = (Math.random() - 0.5) * WORLD_WIDTH;
//   const y = (Math.random() - 0.5) * WORLD_HEIGHT;
//   game.addEntity(createMonster(x, y));
// }

for (let i = 0; i < BOSS_COUNT; i++) {
  const x = (Math.random() - 0.5) * WORLD_WIDTH;
  const y = (Math.random() - 0.5) * WORLD_HEIGHT;
  game.addEntity(createBoss(x, y));
}

// const itemTypes = ['sword', 'axe', 'bow', 'staff', 'claw', 'bite'];
// for (let i = 0; i < 30; i++) {
//   const x = (Math.random() - 0.5) * WORLD_WIDTH;
//   const y = (Math.random() - 0.5) * WORLD_HEIGHT;
//   const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
//   game.addEntity(createItem(x, y, itemType));
// }

generateWorld(game);

// 最背面に描画させるため先頭に挿入
const grassBg = createGrassBackground();
grassBg.game = game;
game.entities.unshift(grassBg);

game.run();
