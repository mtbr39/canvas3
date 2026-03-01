let nextId = 0;

export class Entity {
  constructor() {
    this.id = nextId++;
    this.components = new Map();
    this.game = null;
  }

  addComponent(name, component) {
    component.entity = this;
    this.components.set(name, component);
    return this;
  }

  getComponent(name) {
    return this.components.get(name);
  }

  hasComponent(name) {
    return this.components.has(name);
  }

  removeComponent(name) {
    this.components.delete(name);
    return this;
  }

  update() {
    for (const component of this.components.values()) {
      if (component.update) {
        component.update();
      }
    }
  }

  render() {
    for (const component of this.components.values()) {
      if (component.render) {
        component.render();
      }
    }
  }
}
