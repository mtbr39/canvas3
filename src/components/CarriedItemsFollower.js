import { FollowOwner } from './FollowOwner.js';

// アイテムの所持表現はこのコンポーネントが一元管理する。
// 他のコンポーネントは FollowOwner を直接操作せず、Inventory の add/remove だけを使うこと。
export class CarriedItemsFollower {
  constructor() {
    this.entity = null;
  }

  update() {
    const inventory = this.entity.getComponent('inventory');
    if (!inventory) return;

    inventory.items.forEach((item, i) => {
      let follow = item.getComponent('followOwner');
      if (!follow) {
        item.addComponent('followOwner', new FollowOwner());
        follow = item.getComponent('followOwner');
      }
      const col = i % 2;
      const row = Math.floor(i / 2);
      follow.setOwner(this.entity, 30 + row * 25, (col - 0.5) * 20);
    });
  }
}
