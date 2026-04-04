import createItem from '../entities/Item.js';

// インベントリ間でアイテムを移す。スタック・entity管理・所有権をすべてここで扱う。
// qty 省略時はスタック全量を移す。
export function transfer(item, fromInventory, toInventory, qty = null) {
  const game = fromInventory.entity.game;
  const itemInfo = item.getComponent('itemInfo');
  const moveQty = qty ?? itemInfo.quantity;

  const existing = toInventory.findByType(itemInfo.itemType);

  if (itemInfo.quantity <= moveQty) {
    // スタック全体を移動
    fromInventory.remove(item);
    if (existing) {
      existing.getComponent('itemInfo').quantity += itemInfo.quantity;
      game.markEntityForRemoval(item);
      return existing;
    }
    itemInfo.setOwner(toInventory.entity.id);
    toInventory.add(item);
    return item;
  } else {
    // 一部だけ移動。元のスタックから切り出す。
    itemInfo.quantity -= moveQty;
    if (existing) {
      existing.getComponent('itemInfo').quantity += moveQty;
      return existing;
    }
    const t = item.getComponent('transform');
    const split = createItem(t.x, t.y, itemInfo.itemType);
    split.getComponent('itemInfo').quantity = moveQty;
    split.getComponent('itemInfo').setOwner(toInventory.entity.id);
    game.addEntity(split);
    toInventory.add(split);
    return split;
  }
}

// インベントリから地面へ落とす。
export function drop(item, fromInventory, x, y) {
  fromInventory.remove(item);
  const t = item.getComponent('transform');
  t.x = x;
  t.y = y;
  item.getComponent('itemInfo').drop();
}

// 地面にあるアイテム（すでに game.entities にある）をインベントリへ拾う。
export function pickup(item, toInventory) {
  const game = toInventory.entity.game;
  const itemInfo = item.getComponent('itemInfo');
  const existing = toInventory.findByType(itemInfo.itemType);
  if (existing) {
    existing.getComponent('itemInfo').quantity += itemInfo.quantity;
    game.markEntityForRemoval(item);
    return existing;
  }
  itemInfo.setOwner(toInventory.entity.id);
  toInventory.add(item);
  return item;
}

// 新規アイテムをインベントリへ直接入れる（game への追加も行う）。
export function give(item, toInventory) {
  toInventory.entity.game.addEntity(item);
  return pickup(item, toInventory);
}
