export class Nutrition {
  constructor() {
    this.entity = null;
    this.max = 100;
    this.current = Math.random() * this.max;
    this.decayRate = 0.5; // per second
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

  update() {
    this.current = Math.max(this.current - this.decayRate * this.entity.game.deltaTime, 0);
  }
}
