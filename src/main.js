import { Game } from './core/Game.js';
import { createHuman } from './entities/Human.js';
import { createMonster } from './entities/Monster.js';
import createItem from './entities/Item.js';
import { createLocation } from './entities/Location.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

console.log('v121');

for (let i = 0; i < 20; i++) {
  const x = Math.random() * 1920;
  const y = Math.random() * 1080;
  game.addEntity(createHuman(x, y));
}

for (let i = 0; i < 20; i++) {
  const x = Math.random() * 1920;
  const y = Math.random() * 1080;
  game.addEntity(createMonster(x, y));
}

const itemTypes = ['sword', 'axe', 'bow', 'staff', 'claw', 'bite'];
for (let i = 0; i < 30; i++) {
  const x = Math.random() * 1920;
  const y = Math.random() * 1080;
  const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  game.addEntity(createItem(x, y, itemType));
}

game.addEntity(createLocation(400, 300, 'city', '王都'));
game.addEntity(createLocation(900, 600, 'dungeon', 'ダンジョン'));

game.run();
