export class Entity {
  constructor() {
    this.components = new Map();
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

  update(context) {
    for (const component of this.components.values()) {
      if (component.update) {
        component.update(context);
      }
    }
  }

  render(context) {
    for (const component of this.components.values()) {
      if (component.render) {
        component.render(context);
      }
    }
  }
}
