export class Nutrition {
  constructor() {
    this.entity = null;
    this.max = 100;
    this.current = 100;
  }

  eat(amount) {
    this.current = Math.min(this.current + amount, this.max);
  }

  consume(amount) {
    this.current = Math.max(this.current - amount, 0);
  }

  get ratio() {
    return this.current / this.max;
  }
}
