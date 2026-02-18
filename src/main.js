import { Game } from './core/Game.js';
import { PartyManager } from './components/PartyManager.js';
import { createHuman } from './entities/Human.js';
import { createMonster } from './entities/Monster.js';
import createItem from './entities/Item.js';
import { createLocation } from './entities/Location.js';
import { createVillage } from './entities/Village.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

game.register('partyManager', new PartyManager());

console.log('v121');

const WORLD_WIDTH = 16000;
const WORLD_HEIGHT = 8000;

for (let i = 0; i < 20; i++) {
  const x = (Math.random() - 0.5) * WORLD_WIDTH;
  const y = (Math.random() - 0.5) * WORLD_HEIGHT;
  game.addEntity(createHuman(x, y));
}

for (let i = 0; i < 20; i++) {
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

for (const e of createVillage(1400, 400, '南の村')) {
  game.addEntity(e);
}

for (const e of createVillage(-8000, -400, '西の村')) {
  game.addEntity(e);
}

game.run();
