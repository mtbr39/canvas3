export class Tag {
  constructor(tag = '') {
    this.tags = tag ? [tag] : [];
  }

  add(tag) {
    this.tags.push(tag);
    return this;
  }

  hasTag(tag) {
    return this.tags.includes(tag);
  }
}
