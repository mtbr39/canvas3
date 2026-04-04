import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { Movement } from '../components/Movement.js';
import { Behavior } from '../components/Behavior.js';
import { Health } from '../components/Health.js';
import { Combat } from '../components/Combat.js';
import { Equipment } from '../components/Equipment.js';
import { IdleState } from '../states/IdleState.js';
import { ShapeRenderer } from '../components/ShapeRenderer.js';
import { Collider } from '../components/Collider.js';
import { Tag } from '../components/Tag.js';
import { InfoRenderer } from '../components/InfoRenderer.js';
import { FloatingText } from '../components/FloatingText.js';
import { createInterruptCheck } from '../states/DecisionState.js';
import Inventory from '../components/Inventory.js';
import ItemCollector from '../components/ItemCollector.js';
import { CarriedItemsFollower } from '../components/CarriedItemsFollower.js';
import { Resident } from '../components/Resident.js';
import { Party } from '../components/Party.js';
import { Nutrition } from '../components/Nutrition.js';
import { Vitality } from '../components/Vitality.js';
import createItem from './Item.js';
import { colors } from '../data/Colors.js';

const HUMAN_STATS = {
  detectionRange: 200,
};

const INITIAL_COINS_MIN = 3;
const INITIAL_COINS_MAX = 10;

// x, y を中心に size 人のパーティを生成してgameに追加する
export function createHumanParty(game, x, y, size) {
  const members = [];
  for (let i = 0; i < size; i++) {
    const mx = x + (Math.random() - 0.5) * 100;
    const my = y + (Math.random() - 0.5) * 100;
    const human = createHuman(mx, my);
    game.addEntity(human);
    _giveInitialCoins(game, human);
    members.push(human);
  }
  if (members.length > 1) {
    members[0].getComponent('party').form(members.slice(1));
  }
  return members;
}

function _giveInitialCoins(game, entity) {
  const inventory = entity.getComponent('inventory');
  const transform = entity.getComponent('transform');
  if (!inventory || !transform) return;

  const coin = createItem(transform.x, transform.y, 'coin');
  coin.getComponent('itemInfo').quantity = INITIAL_COINS_MIN + Math.floor(Math.random() * (INITIAL_COINS_MAX - INITIAL_COINS_MIN + 1));
  coin.getComponent('itemInfo').setOwner(entity.id);
  game.addEntity(coin);
  inventory.add(coin);
}

export function createHuman(x, y) {
  const entity = new Entity();

  // 50% adventurer, 50% villager
  const isAdventurer = Math.random() < 0.5;

  const health = new Health(100);
  health.removeOnDeath = false;

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('movement', new Movement(50))
    .addComponent('behavior', new Behavior(new IdleState()))
    .addComponent('health', health)
    .addComponent('collider', new Collider({ type: 'circle', radius: 25 }))
    .addComponent('shapeRenderer', new ShapeRenderer({
      fill: colors.base01,
    }))
    .addComponent('tag', new Tag('human'))
    .addComponent('infoRenderer', new InfoRenderer())
    .addComponent('floatingText', new FloatingText())
    .addComponent('inventory', new Inventory())
    .addComponent('itemCollector', new ItemCollector())
    .addComponent('carriedItemsFollower', new CarriedItemsFollower())
    .addComponent('resident', new Resident())
    .addComponent('party', new Party())
    .addComponent('nutrition', new Nutrition())
    .addComponent('vitality', new Vitality());

  const behavior = entity.getComponent('behavior');
  if (isAdventurer) {
    const weapons = ['sword', 'axe', 'bow', 'staff'];
    const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];

    entity
      .addComponent('equipment', new Equipment(randomWeapon))
      .addComponent('combat', Combat.createAggressive(HUMAN_STATS.detectionRange));
  } else {
    entity.addComponent('combat', Combat.createDefensive(HUMAN_STATS.detectionRange));
  }

  behavior.addInterruptCheck(createInterruptCheck());

  return entity;
}
