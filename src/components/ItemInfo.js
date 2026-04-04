class ItemInfo {
  constructor(itemType) {
    this.itemType = itemType;
    this.state = 'dropped';
    this.owner = null;
    this.price = 0;
    this.quantity = 1;
  }

  canPickup() {
    return this.state === 'dropped' && this.owner === null;
  }

  drop() {
    this.state = 'dropped';
    this.owner = null;
    this.price = 0;
  }

  setOwner(ownerId) {
    this.state = 'owned';
    this.owner = ownerId;
    this.price = 0;
  }

  setPrice(price) {
    this.price = price;
  }
}

export default ItemInfo;
