import { PerlinNoise } from '../core/PerlinNoise.js';
import { createGroundTint } from '../entities/GroundTint.js';
import { createGrassField } from '../entities/GrassField.js';
import { createStoneField } from '../entities/StoneField.js';
import { createTreeField } from '../entities/TreeField.js';

// ワールドサイズはここで一元管理
export const WORLD_WIDTH = 22000;
export const WORLD_HEIGHT = 22000;

// バイオームの「塊」の大きさ
const BIOME_SCALE = 0.00025;

// 各バイオームのシード（変えればパターンが変わる）
const STONE_BIOME_SEED = 91;
const TREE_BIOME_SEED = 11;

/**
 * ワールド背景（地面色・草・石・木）を生成して game.entities に挿入する。
 * 描画順は ground → grass → stone → tree の順で最下層から積む。
 *
 * 「石が多い場所」「木が多い場所」は独立したバイオームマップで決まる。
 * 同じシード/スケールにすれば重なる、違えば独立、シードを揃えて極性を反転すれば排他に。
 */
export function createWorldBackdrop(game) {
  const stoneBiome = new PerlinNoise(STONE_BIOME_SEED);
  const treeBiome = new PerlinNoise(TREE_BIOME_SEED);

  const stoneSampler = (x, y) => stoneBiome.noise(x * BIOME_SCALE, y * BIOME_SCALE);
  const treeSampler  = (x, y) => treeBiome.noise(x * BIOME_SCALE, y * BIOME_SCALE);

  const groundTint = createGroundTint();
  configure(groundTint, 'groundTint', { worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });

  const grassField = createGrassField();
  configure(grassField, 'grassField', { worldWidth: WORLD_WIDTH, worldHeight: WORLD_HEIGHT });

  const stoneField = createStoneField();
  configure(stoneField, 'stoneField', {
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    biomeSampler: stoneSampler,
  });

  const treeField = createTreeField();
  configure(treeField, 'treeField', {
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    biomeSampler: treeSampler,
  });

  // 描画順: ground(最下) → grass → stone → tree → 既存エンティティ
  const layered = [groundTint, grassField, stoneField, treeField];
  for (const e of layered) e.game = game;
  game.entities.unshift(...layered);
}

function configure(entity, componentName, props) {
  const c = entity.getComponent(componentName);
  for (const k in props) c[k] = props[k];
}
