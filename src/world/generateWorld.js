import { createVillage } from '../entities/Village.js';
import { createField } from '../entities/Field.js';
import { createHumanParty } from '../entities/Human.js';
import { createMountain } from '../entities/Mountain.js';

const WORLD_WIDTH = 20000;
const WORLD_HEIGHT = 20000;
const WORLD_MARGIN = 500;

const VILLAGE_COUNT = 3;
const VILLAGE_HALF_SIZE = 1500;    // 村の最大サイズ(3000)の半分
const VILLAGE_MIN_GAP = 2000;      // 村同士の最低限の間隔（端から端）
const VILLAGE_HUMAN_COUNT = 10;
const VILLAGE_SPAWN_RADIUS = 800;

const FIELD_TYPES = ['grassland', 'forest'];
const FIELD_SIZE_STEPS = [
  { halfSize: 1500, maxMonsters: 20 },  // 大（3000x3000）
  { halfSize: 1000, maxMonsters: 13 },  // 中（2000x2000）
  { halfSize:  600, maxMonsters:  7 },  // 小（1200x1200）
];
const FIELD_FAIL_THRESHOLD = 30;  // この回数連続で配置失敗したら次のサイズに降格

const MOUNTAIN_SIZE_STEPS = [1500, 1000, 600];  // フィールドと同じ大・中・小
const MOUNTAIN_COUNT = 10;

const VILLAGE_NAMES = ['北の村', '南の村', '東の村', '西の村', '中央の村'];
const FIELD_NAMES = ['草原', '森', '荒野', '湿地', '丘陵', '渓谷', '平原', '密林'];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function randomWorldPos() {
  return {
    x: (Math.random() - 0.5) * (WORLD_WIDTH - WORLD_MARGIN * 2),
    y: (Math.random() - 0.5) * (WORLD_HEIGHT - WORLD_MARGIN * 2),
  };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function notOverlapping(p, halfSizeP, others, gap = 200) {
  return others.every(({ pos, halfSize }) => {
    const minDist = halfSizeP + halfSize + gap;
    return Math.abs(p.x - pos.x) >= minDist || Math.abs(p.y - pos.y) >= minDist;
  });
}

function placeRects(count, halfSize, obstacles = [], gap = 200, maxAttempts = 300) {
  const placed = [];
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const p = randomWorldPos();
      const allObstacles = [...obstacles, ...placed];
      if (notOverlapping(p, halfSize, allObstacles, gap)) {
        placed.push({ pos: p, halfSize });
        break;
      }
    }
  }
  return placed.map(({ pos }) => pos);
}

function nearestDist(point, positions) {
  return Math.min(...positions.map(p => dist(point, p)));
}

export function generateWorld(game) {
  // 山を最初に配置（山同士は重なりOK）
  const mountainObstacles = [];
  for (let i = 0; i < MOUNTAIN_COUNT; i++) {
    const halfSize = MOUNTAIN_SIZE_STEPS[Math.floor(Math.random() * MOUNTAIN_SIZE_STEPS.length)];
    const p = randomWorldPos();
    mountainObstacles.push({ pos: p, halfSize });
    game.addEntity(createMountain(p.x, p.y, halfSize * 2));
  }

  const villagePositions = placeRects(VILLAGE_COUNT, VILLAGE_HALF_SIZE, mountainObstacles, VILLAGE_MIN_GAP);
  const villageObstacles = villagePositions.map(pos => ({ pos, halfSize: VILLAGE_HALF_SIZE }));

  const shuffledVillageNames = shuffle(VILLAGE_NAMES);

  for (let i = 0; i < villagePositions.length; i++) {
    const { x, y } = villagePositions[i];
    const name = shuffledVillageNames[i] ?? `村${i + 1}`;
    for (const e of createVillage(x, y, name)) {
      game.addEntity(e);
    }

    let count = 0;
    while (count < VILLAGE_HUMAN_COUNT) {
      const size = Math.min(Math.floor(Math.random() * 4) + 1, VILLAGE_HUMAN_COUNT - count);
      const hx = x + (Math.random() - 0.5) * VILLAGE_SPAWN_RADIUS * 2;
      const hy = y + (Math.random() - 0.5) * VILLAGE_SPAWN_RADIUS * 2;
      createHumanParty(game, hx, hy, size);
      count += size;
    }
  }

  // サイズを段階的に落としながら、置けなくなるまでフィールドを配置する
  const placedFields = []; // { pos, halfSize }
  const fieldObstacles = [...mountainObstacles, ...villageObstacles];
  const fieldNames = shuffle(FIELD_NAMES);
  let nameIndex = 0;

  for (const step of FIELD_SIZE_STEPS) {
    let failures = 0;
    while (failures < FIELD_FAIL_THRESHOLD) {
      const p = randomWorldPos();
      if (notOverlapping(p, step.halfSize, fieldObstacles)) {
        fieldObstacles.push({ pos: p, halfSize: step.halfSize });
        placedFields.push({ pos: p, halfSize: step.halfSize, maxMonsters: step.maxMonsters });
        failures = 0;
      } else {
        failures++;
      }
    }
  }

  const fieldPositions = placedFields.map(f => f.pos);
  const distToVillage = fieldPositions.map(p => nearestDist(p, villagePositions));
  const minDist = Math.min(...distToVillage);
  const maxDist = Math.max(...distToVillage);
  const distRange = maxDist - minDist || 1;

  for (let i = 0; i < placedFields.length; i++) {
    const { pos, maxMonsters: baseMonsters } = placedFields[i];
    const { x, y } = pos;
    const type = FIELD_TYPES[Math.floor(Math.random() * FIELD_TYPES.length)];
    const name = fieldNames[nameIndex++ % fieldNames.length];

    const strength = (distToVillage[i] - minDist) / distRange; // 0=弱い 1=強い
    const maxMonsters = Math.round(baseMonsters * (0.5 + strength * 0.5));

    const halfSize = placedFields[i].halfSize;
    game.addEntity(createField(x, y, type, name, maxMonsters, halfSize * 2));
  }
}
