import { Game } from './core/Game.js';
import { PartyManager } from './components/PartyManager.js';
import { MonsterSpawner } from './components/MonsterSpawner.js';
import { createHumanParty } from './entities/Human.js';
import { createMonster, createBoss } from './entities/Monster.js';
import createItem from './entities/Item.js';
import { createLocation } from './entities/Location.js';
import { createVillage } from './entities/Village.js';
import { createField } from './entities/Field.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

game.register('partyManager', new PartyManager());
// game.register('monsterSpawner', new MonsterSpawner());

console.log('v0323');

const WORLD_WIDTH = 8000;
const WORLD_HEIGHT = 4000;
const HUMAN_COUNT = 30;
const MONSTER_COUNT = 30;
const BOSS_COUNT = 3;
const VILLAGE_HUMAN_COUNT = 10;
const VILLAGE_SPAWN_RADIUS = 800;

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

const villagePositions = [
  { x: 4000, y: 2000, name: '南の村' },
  { x: -4000, y: -400, name: '西の村' },
];

for (const { x, y, name } of villagePositions) {
  for (const e of createVillage(x, y, name)) {
    game.addEntity(e);
  }

  let count = 0;
  while (count < VILLAGE_HUMAN_COUNT) {
    const size = Math.min(Math.floor(Math.random() * 4) + 1, VILLAGE_HUMAN_COUNT - count);
    const hx = x + (Math.random() - 0.5) * VILLAGE_SPAWN_RADIUS * 2;
    const hy = y + (Math.random() - 0.5) * VILLAGE_SPAWN_RADIUS * 2;
    createHumanParty(game, hx, hy, size);
    count += size;
  }
}

const fieldPositions = [
  { x: 0, y: 0, type: 'grassland', name: '中央草原' },
  { x: 2000, y: -2000, type: 'forest', name: '東の森' },
];

for (const { x, y, type, name } of fieldPositions) {
  game.addEntity(createField(x, y, type, name));
}

game.run();
