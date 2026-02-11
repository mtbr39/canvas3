export class Collider {
  constructor(shape) {
    this.entity = null;
    this.shape = shape; // { type: 'circle', radius } or { type: 'rect', width, height }
  }
}
