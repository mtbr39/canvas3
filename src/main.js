import { Game } from './core/Game.js';
import { createHuman } from './entities/Human.js';
import { createMonster } from './entities/Monster.js';

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

game.run();
