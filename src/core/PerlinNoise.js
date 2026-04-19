export class PerlinNoise {
  constructor(seed = 0) {
    this.p = new Uint8Array(512);
    const perm = [];
    for (let i = 0; i < 256; i++) perm.push(i);

    let s = (seed | 0) || 1;
    const random = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(a, b, t) { return a + t * (b - a); }
  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);
    const a = this.p[X] + Y;
    const b = this.p[X + 1] + Y;
    return this.lerp(
      this.lerp(this.grad(this.p[a], xf, yf), this.grad(this.p[b], xf - 1, yf), u),
      this.lerp(this.grad(this.p[a + 1], xf, yf - 1), this.grad(this.p[b + 1], xf - 1, yf - 1), u),
      v
    );
  }
}
