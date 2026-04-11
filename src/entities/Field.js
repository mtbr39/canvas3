import { createLocation } from './Location.js';
import { FieldSpawner } from '../components/FieldSpawner.js';

const FIELD_CONFIGS = {
  grassland: {
    width: 3000,
    height: 3000,
    maxMonsters: 15,
  },
  forest: {
    width: 2000,
    height: 2000,
    maxMonsters: 10,
  },
};

export function createField(x, y, type, name = '', maxMonsters = null, size = null) {
  const config = FIELD_CONFIGS[type] ?? FIELD_CONFIGS.grassland;
  const width = size ?? config.width;
  const height = size ?? config.height;
  const location = createLocation(x, y, type, name, width, height);

  const spawner = new FieldSpawner();
  spawner.maxMonsters = maxMonsters ?? config.maxMonsters;
  location.addComponent('fieldSpawner', spawner);

  return location;
}
