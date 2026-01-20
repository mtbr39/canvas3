import { Game } from './core/Game.js';
import { createHuman } from './entities/Human.js';
import { createAnimal } from './entities/Animal.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

console.log('v121');

for (let i = 0; i < 10; i++) {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  game.addEntity(createHuman(x, y));
}

for (let i = 0; i < 10; i++) {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  game.addEntity(createAnimal(x, y));
}

game.run();
