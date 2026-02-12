class ItemInfo {
  constructor(itemType) {
    this.itemType = itemType;
    this.state = 'dropped';
    this.owner = null;
    this.price = 0;
  }

  canPickup() {
    return this.state === 'dropped' && this.owner === null;
  }

  canPurchase() {
    return this.state === 'forSale';
  }

  drop() {
    this.state = 'dropped';
    this.owner = null;
  }

  setOwner(ownerId) {
    this.state = 'owned';
    this.owner = ownerId;
  }

  setSalePrice(price) {
    this.state = 'forSale';
    this.price = price;
  }
}

export default ItemInfo;
