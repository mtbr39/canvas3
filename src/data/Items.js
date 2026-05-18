import { colors } from './Colors.js';

export const RANGE_TIERS = {
  'short': 200,
  'mid-short': 300,
  'mid': 400,
  'mid-long': 600,
  'long': 800
};

// 武器の予備動作の長さ [秒]。武器側は 'fast'/'normal'/'slow' で指定し、実数はここで定義する。
export const WINDUP_BY_SPEED = {
  very_fast: 0.1,
  fast: 0.5,
  normal: 1.0,
  slow: 1.5,
};
export const DEFAULT_WINDUP_SPEED = 'normal';

export const ITEMS = {
  // === 人間用武器 ===
  sword: {
    name: '剣',
    categories: ['weapon'],
    attackType: 'melee',
    damage: 15,
    cooldown: 1.0,
    windupSpeed: 'very_fast',
    hitbox: {
      radius: 35,
      duration: 0.2,
      visual: 'slash'
    },
    dropVisual: {
      shape: 'rect',
      fill: colors.yellow01
    }
  },

  axe: {
    name: '斧',
    categories: ['weapon'],
    attackType: 'melee',
    damage: 25,
    cooldown: 1.5,
    windupSpeed: 'very_fast',
    hitbox: {
      radius: 40,
      duration: 0.3,
      visual: 'slash'
    },
    dropVisual: {
      shape: 'rect',
      fill: colors.orange01
    }
  },

  bow: {
    name: '弓',
    categories: ['weapon'],
    attackType: 'ranged',
    damage: 12,
    cooldown: 1.2,
    windupSpeed: 'normal',
    projectile: {
      radius: 8,
      speed: 400,
      range: 'mid-short'
    },
    dropVisual: {
      shape: 'rect',
      fill: colors.green01
    }
  },

  staff: {
    name: '杖',
    categories: ['weapon'],
    attackType: 'ranged',
    damage: 20,
    cooldown: 2.0,
    windupSpeed: 'slow',
    projectile: {
      radius: 12,
      speed: 300,
      range: 'mid'
    },
    dropVisual: {
      shape: 'rect',
      fill: colors.gray03
    }
  },

  bare_hands: {
    name: '素手',
    categories: ['weapon'],
    attackType: 'melee',
    damage: 5,
    cooldown: 1.0,
    windupSpeed: 'very_fast',
    hitbox: {
      radius: 20,
      duration: 0.15
    }
  },

  // === モンスター用武器 ===
  claw: {
    name: '爪',
    categories: ['weapon'],
    attackType: 'melee',
    damage: 8,
    cooldown: 0.8,
    windupSpeed: 'fast',
    hitbox: {
      radius: 25,
      duration: 0.15
    },
    dropVisual: {
      shape: 'rect',
      fill: colors.green02
    }
  },

  bite: {
    name: '牙',
    categories: ['weapon'],
    attackType: 'melee',
    damage: 12,
    cooldown: 1.0,
    windupSpeed: 'normal',
    hitbox: {
      radius: 20,
      duration: 0.2
    },
    dropVisual: {
      shape: 'rect',
      fill: colors.gray06
    }
  },

  boss_claw: {
    name: 'ボスの爪',
    categories: ['weapon'],
    attackType: 'melee',
    damage: 20,
    cooldown: 1.2,
    windupSpeed: 'slow',
    hitbox: {
      radius: 50,
      duration: 0.25
    }
  },

  // === 通貨 ===
  coin: {
    name: 'コイン',
    categories: ['currency'],
    dropVisual: {
      shape: 'rect',
      fill: colors.yellow01
    }
  },

  // === 食料 ===
  bread: {
    name: 'パン',
    categories: ['food'],
    nutrition: 50,
    price: 1,
    dropVisual: {
      shape: 'rect',
      fill: colors.brown01
    }
  },

  meat: {
    name: '普通の肉',
    categories: ['food'],
    nutrition: 40,
    cookingTime: 5,
    dropVisual: {
      shape: 'rect',
      fill: colors.pink01
    }
  },

  // === 素材 ===
  hide: {
    name: '普通の皮',
    categories: ['material'],
    price: 2,
    dropVisual: {
      shape: 'rect',
      fill: colors.brown01
    }
  }
};

