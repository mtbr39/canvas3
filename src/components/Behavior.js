export class Behavior {
  constructor(initialState = null) {
    this.entity = null;
    this.currentState = null;
    this._pendingState = initialState;
    this.interruptChecks = [];
  }

  addInterruptCheck(checkFn) {
    this.interruptChecks.push(checkFn);
  }

  checkInterrupts() {
    for (const check of this.interruptChecks) {
      const newState = check(this.entity, this.currentState);
      if (newState) {
        this.changeState(newState);
        return true;
      }
    }
    return false;
  }

  changeState(state) {
    if (this.currentState && this.currentState.exit) {
      this.currentState.exit(this.entity);
    }
    this.currentState = state;
    if (this.currentState && this.currentState.enter) {
      this.currentState.enter(this.entity);
    }
  }

  update() {
    if (this._pendingState) {
      this.changeState(this._pendingState);
      this._pendingState = null;
    }

    if (this.checkInterrupts()) {
      return;
    }

    if (this.currentState && this.currentState.update) {
      this.currentState.update(this.entity);
    }
  }
}
