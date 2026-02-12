import { Entity } from '../core/Entity.js';
import { Transform } from '../components/Transform.js';
import { ShapeRenderer } from '../components/ShapeRenderer.js';
import { Collider } from '../components/Collider.js';
import ItemState from '../components/ItemState.js';
import { Tag } from '../components/Tag.js';
import { ITEMS } from '../data/Items.js';

function createItem(x, y, itemType) {
  const itemData = ITEMS[itemType];
  if (!itemData) {
    console.error(`Unknown item type: ${itemType}`);
    return null;
  }

  const item = new Entity();

  item.addComponent('transform', new Transform(x, y));
  item.addComponent('tag', new Tag('item'));
  item.addComponent('itemState', new ItemState());
  item.addComponent('collider', new Collider({ type: 'rect', width: 16, height: 16 }));

  const dropVisual = itemData.dropVisual;
  item.addComponent('shapeRenderer', new ShapeRenderer({
    fill: dropVisual.fill
  }));

  item.itemType = itemType;
  item.itemData = itemData;

  return item;
}

export default createItem;
