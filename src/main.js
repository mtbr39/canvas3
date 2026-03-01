import { Game } from './core/Game.js';
import { PartyManager } from './components/PartyManager.js';
import { createHumanParty } from './entities/Human.js';
import { createMonster } from './entities/Monster.js';
import createItem from './entities/Item.js';
import { createLocation } from './entities/Location.js';
import { createVillage } from './entities/Village.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

game.register('partyManager', new PartyManager());

console.log('v0302');

const WORLD_WIDTH = 8000;
const WORLD_HEIGHT = 4000;
const HUMAN_COUNT = 30;
const MONSTER_COUNT = 30;

let humanCount = 0;
while (humanCount < HUMAN_COUNT) {
  const size = Math.min(Math.floor(Math.random() * 4) + 1, HUMAN_COUNT - humanCount);
  const x = (Math.random() - 0.5) * WORLD_WIDTH;
  const y = (Math.random() - 0.5) * WORLD_HEIGHT;
  createHumanParty(game, x, y, size);
  humanCount += size;
}

for (let i = 0; i < MONSTER_COUNT; i++) {
  const x = (Math.random() - 0.5) * WORLD_WIDTH;
  const y = (Math.random() - 0.5) * WORLD_HEIGHT;
  game.addEntity(createMonster(x, y));
}

const itemTypes = ['sword', 'axe', 'bow', 'staff', 'claw', 'bite'];
for (let i = 0; i < 30; i++) {
  const x = (Math.random() - 0.5) * WORLD_WIDTH;
  const y = (Math.random() - 0.5) * WORLD_HEIGHT;
  const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  game.addEntity(createItem(x, y, itemType));
}

for (const e of createVillage(4000, 2000, '南の村')) {
  game.addEntity(e);
}

for (const e of createVillage(-4000, -400, '西の村')) {
  game.addEntity(e);
}

game.run();
