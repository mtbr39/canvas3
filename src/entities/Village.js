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

  const DENSITY_SCALE = 10_000_000;
  const INN_DENSITY = 20;
  const SHOP_DENSITY = 10;
  const MATERIAL_SHOP_DENSITY = 5;

  const area = width * height;
  const innCount = Math.max(1, Math.round(INN_DENSITY * area / DENSITY_SCALE + (Math.random() - 0.5) * 2));
  const shopCount = Math.max(1, Math.round(SHOP_DENSITY * area / DENSITY_SCALE + (Math.random() - 0.5) * 2));
  const materialShopCount = Math.max(1, Math.round(MATERIAL_SHOP_DENSITY * area / DENSITY_SCALE + (Math.random() - 0.5)));

  const buildings = [];

  for (let i = 0; i < innCount; i++) {
    const pos = tryPlace(x, y, hw, hh, margin, 'inn', placed);
    if (pos) buildings.push(createBuilding(pos.x, pos.y, 'inn'));
  }

  for (let i = 0; i < shopCount; i++) {
    const pos = tryPlace(x, y, hw, hh, margin, 'foodShop', placed);
    if (pos) buildings.push(createBuilding(pos.x, pos.y, 'foodShop'));
  }

  for (let i = 0; i < materialShopCount; i++) {
    const pos = tryPlace(x, y, hw, hh, margin, 'materialShop', placed);
    if (pos) buildings.push(createBuilding(pos.x, pos.y, 'materialShop'));
  }

  return [location, ...buildings];
}
