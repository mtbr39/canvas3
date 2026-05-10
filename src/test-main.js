import { Game } from './core/Game.js';
import { PartyManager } from './components/PartyManager.js';
import { EntityInfoPanel } from './components/EntityInfoPanel.js';
import { createHumanParty } from './entities/Human.js';
import { createMonster } from './entities/Monster.js';
import { createWorldBackdrop } from './world/WorldBackdrop.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

game.register('partyManager', new PartyManager());

const entityInfoPanel = new EntityInfoPanel();
game.register('entityInfoPanel', entityInfoPanel);
entityInfoPanel.setup();

console.log('test-map: combat');

createHumanParty(game, -150, 0, 3, { isAdventurer: true });
createHumanParty(game, 150, 0, 3, { isAdventurer: true });

game.addEntity(createMonster(0, -150));
game.addEntity(createMonster(0, 150));

createWorldBackdrop(game);

game.run();
