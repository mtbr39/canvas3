import { createVillage } from '../entities/Village.js';
import { createField } from '../entities/Field.js';
import { createHumanParty } from '../entities/Human.js';
import { createMountain } from '../entities/Mountain.js';
import { createRoad } from '../entities/Road.js';

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
const MOUNTAIN_COUNT = 20;

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

// 2線分の交差判定
function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1x = bx - ax, d1y = by - ay;
  const d2x = dx - cx, d2y = dy - cy;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return false;
  const t = ((cx - ax) * d2y - (cy - ay) * d2x) / cross;
  const u = ((cx - ax) * d1y - (cy - ay) * d1x) / cross;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// 線分と矩形（中心座標＋サイズ）の交差判定
function segmentIntersectsRect(ax, ay, bx, by, rx, ry, rw, rh) {
  const left   = rx - rw / 2;
  const right  = rx + rw / 2;
  const top    = ry - rh / 2;
  const bottom = ry + rh / 2;

  // どちらかの端点が矩形内にある（境界上は含まない）
  if (ax > left && ax < right && ay > top && ay < bottom) return true;
  if (bx > left && bx < right && by > top && by < bottom) return true;

  return (
    segmentsIntersect(ax, ay, bx, by, left,  top,    right, top)    ||
    segmentsIntersect(ax, ay, bx, by, right, top,    right, bottom) ||
    segmentsIntersect(ax, ay, bx, by, right, bottom, left,  bottom) ||
    segmentsIntersect(ax, ay, bx, by, left,  bottom, left,  top)
  );
}

// 山を迂回するウェイポイント列を生成する（視認グラフ + Dijkstra法）
function buildPath(ax, ay, bx, by, mountains, margin = 300) {
  const src = { x: ax, y: ay };
  const dst = { x: bx, y: by };

  // 全山のコーナーを候補ノードとして収集（境界より1単位外）
  const nodes = [src, dst];
  for (const { pos, halfSize } of mountains) {
    const e = halfSize + margin + 1;
    nodes.push(
      { x: pos.x - e, y: pos.y - e },
      { x: pos.x + e, y: pos.y - e },
      { x: pos.x + e, y: pos.y + e },
      { x: pos.x - e, y: pos.y + e },
    );
  }

  // 2ノード間のセグメントが全山をクリアしているか判定
  function isVisible(a, b) {
    for (const { pos, halfSize } of mountains) {
      const expanded = halfSize + margin;
      if (segmentIntersectsRect(a.x, a.y, b.x, b.y, pos.x, pos.y, expanded * 2, expanded * 2)) {
        return false;
      }
    }
    return true;
  }

  // Dijkstra: src(index 0) → dst(index 1)
  const n = nodes.length;
  const distArr = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);
  distArr[0] = 0;

  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!visited[i] && distArr[i] < Infinity && (u === -1 || distArr[i] < distArr[u])) u = i;
    }
    if (u === -1 || u === 1) break;
    visited[u] = true;

    for (let v = 0; v < n; v++) {
      if (visited[v]) continue;
      if (!isVisible(nodes[u], nodes[v])) continue;
      const d = distArr[u] + Math.hypot(nodes[v].x - nodes[u].x, nodes[v].y - nodes[u].y);
      if (d < distArr[v]) {
        distArr[v] = d;
        prev[v] = u;
      }
    }
  }

  // パスを復元
  if (distArr[1] === Infinity) return [src, dst]; // 経路なし（フォールバック）

  const path = [];
  for (let cur = 1; cur !== -1; cur = prev[cur]) {
    path.unshift(nodes[cur]);
  }
  return path;
}

// { pos, halfSize } の矩形内でランダムな点を返す
function randomPointInRect({ pos, halfSize }) {
  return {
    x: pos.x + (Math.random() - 0.5) * halfSize * 2,
    y: pos.y + (Math.random() - 0.5) * halfSize * 2,
  };
}

// 全ノード（村＋フィールド）をMST(Prim法)で接続し、道エンティティの配列を返す
// 各ノードの接続点は矩形内のランダムな点を使う
function buildRoadEntities(villageRects, fieldRects, mountainObstacles) {
  const rects = [...villageRects, ...fieldRects];
  if (rects.length < 2) return [];

  // 各ノードのランダムな接続点を事前に決める
  const points = rects.map(randomPointInRect);

  const roads = [];
  const inTree = new Set();
  inTree.add(0);

  while (inTree.size < rects.length) {
    let bestDist = Infinity;
    let bestFrom = null;
    let bestTo = null;

    for (const i of inTree) {
      for (let j = 0; j < rects.length; j++) {
        if (inTree.has(j)) continue;
        const d = dist(points[i], points[j]);
        if (d < bestDist) {
          bestDist = d;
          bestFrom = i;
          bestTo = j;
        }
      }
    }

    inTree.add(bestTo);
    const a = points[bestFrom];
    const b = points[bestTo];
    const waypoints = buildPath(a.x, a.y, b.x, b.y, mountainObstacles);
    roads.push(createRoad(waypoints));
  }

  return roads;
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

  const villageRects = villagePositions.map(pos => ({ pos, halfSize: VILLAGE_HALF_SIZE }));
  const fieldRects   = placedFields.map(({ pos, halfSize }) => ({ pos, halfSize }));
  const roads = buildRoadEntities(villageRects, fieldRects, mountainObstacles);

  // 道は山の直後・村やフィールドより前に追加して描画順を下にする
  for (const road of roads) {
    game.entities.splice(mountainObstacles.length, 0, road);
    road.game = game;
  }
}
