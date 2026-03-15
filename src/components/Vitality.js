export class Vitality {
  constructor() {
    this.entity = null;
    this.max = 100;
    this.current = 100;
  }

  sleep(amount) {
    this.current = Math.min(this.current + amount, this.max);
  }

  tire(amount) {
    this.current = Math.max(this.current - amount, 0);
  }

  get ratio() {
    return this.current / this.max;
  }
}
