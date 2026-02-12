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
import { createCombatInterruptCheck } from '../states/DecisionState.js';
import Inventory from '../components/Inventory.js';
import ItemCollector from '../components/ItemCollector.js';

export function createHuman(x, y) {
  const entity = new Entity();

  // 50% adventurer, 50% villager
  const isAdventurer = Math.random() < 0.5;

  entity
    .addComponent('transform', new Transform(x, y))
    .addComponent('movement', new Movement(50))
    .addComponent('behavior', new Behavior(new IdleState()))
    .addComponent('health', new Health(100))
    .addComponent('collider', new Collider({ type: 'circle', radius: 25 }))
    .addComponent('shapeRenderer', new ShapeRenderer({
      stroke: isAdventurer ? '#ff0000' : '#333333', // Red for adventurers
      strokeWidth: 1
    }))
    .addComponent('tag', new Tag('human'))
    .addComponent('infoRenderer', new InfoRenderer())
    .addComponent('floatingText', new FloatingText())
    .addComponent('inventory', new Inventory())
    .addComponent('itemCollector', new ItemCollector());

  // Only adventurers get combat component
  if (isAdventurer) {
    const weapons = ['sword', 'axe', 'bow', 'staff'];
    const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];

    entity
      .addComponent('equipment', new Equipment(randomWeapon))
      .addComponent('combat', Combat.createAggressive());

    const behavior = entity.getComponent('behavior');
    behavior.addInterruptCheck(createCombatInterruptCheck());

  }

  return entity;
}
