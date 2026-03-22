export const debug = {
  enabled: false,
  log(...args) {
    if (this.enabled) console.log(...args);
  },
};
