export class Behavior {
  constructor(initialState = null) {
    this.entity = null;
    this.currentState = null;
    this._pendingState = initialState;
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
    if (this.currentState && this.currentState.update) {
      this.currentState.update(this.entity);
    }
  }
}
