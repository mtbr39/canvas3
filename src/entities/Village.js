import { createLocation } from './Location.js';
import { createBuilding, BUILDING_CONFIGS } from './Building.js';

const GAP = 20;

function overlaps(ax, ay, aw, ah, placed) {
  return placed.some(p => {
    return Math.abs(ax - p.x) < (aw + p.w) / 2 + GAP &&
           Math.abs(ay - p.y) < (ah + p.h) / 2 + GAP;
  });
}

function tryPlace(x, y, hw, hh, margin, type, placed) {
  const config = BUILDING_CONFIGS[type];

  for (let attempt = 0; attempt < 30; attempt++) {
    const bx = x + (Math.random() * 2 - 1) * (hw - margin);
    const by = y + (Math.random() * 2 - 1) * (hh - margin);

    if (!overlaps(bx, by, config.width, config.height, placed)) {
      placed.push({ x: bx, y: by, w: config.width, h: config.height });
      return { x: bx, y: by };
    }
  }
  return null;
}

export function createVillage(x, y, name = '') {
  const width = 2000 + Math.random() * 1000;
  const height = 2000 + Math.random() * 1000;
  const location = createLocation(x, y, 'village', name, width, height);

  const hw = width / 2;
  const hh = height / 2;
  const margin = 150;
  const placed = [];

  const innCount = 2 + Math.floor(Math.random() * 6);
  const shopCount = 2 + Math.floor(Math.random() * 6);

  const buildings = [];

  for (let i = 0; i < innCount; i++) {
    const pos = tryPlace(x, y, hw, hh, margin, 'inn', placed);
    if (pos) buildings.push(createBuilding(pos.x, pos.y, 'inn'));
  }

  for (let i = 0; i < shopCount; i++) {
    const pos = tryPlace(x, y, hw, hh, margin, 'shop', placed);
    if (pos) buildings.push(createBuilding(pos.x, pos.y, 'shop'));
  }

  return [location, ...buildings];
}
