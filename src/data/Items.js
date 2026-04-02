import { colors } from './Colors.js';

export const ITEMS = {
  // === 人間用武器 ===
  sword: {
    name: '剣',
    categories: ['weapon'],
    attackType: 'melee',
    damage: 15,
    cooldown: 1.0,
    hitbox: {
      radius: 35,
      distance: 45,
      duration: 0.2
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
    hitbox: {
      radius: 40,
      distance: 50,
      duration: 0.3
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
    projectile: {
      radius: 8,
      speed: 400,
      duration: 2.0
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
    projectile: {
      radius: 12,
      speed: 300,
      duration: 3.0
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
    hitbox: {
      radius: 20,
      distance: 30,
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
    hitbox: {
      radius: 25,
      distance: 30,
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
    hitbox: {
      radius: 20,
      distance: 25,
      duration: 0.2
    },
    dropVisual: {
      shape: 'rect',
      fill: colors.gray06
    }
  },

  // === 食料 ===
  bread: {
    name: 'パン',
    categories: ['food'],
    nutrition: 50,
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
    dropVisual: {
      shape: 'rect',
      fill: colors.brown01
    }
  }
};

