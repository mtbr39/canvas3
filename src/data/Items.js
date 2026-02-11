const gray = 'rgba(150, 150, 150, 0.5)';

export const ITEMS = {
  // === 人間用武器 ===
  sword: {
    name: '剣',
    category: 'weapon',
    attackType: 'melee',
    damage: 15,
    cooldown: 1.0,
    hitbox: {
      radius: 35,
      distance: 45,
      duration: 0.2
    },
    visual: {
      fill: 'rgba(200, 200, 255, 0.3)',
      stroke: '#4444ff',
      strokeWidth: 2
    }
  },

  axe: {
    name: '斧',
    category: 'weapon',
    attackType: 'melee',
    damage: 25,
    cooldown: 1.5,
    hitbox: {
      radius: 40,
      distance: 50,
      duration: 0.3
    },
    visual: {
      fill: 'rgba(255, 100, 100, 0.3)',
      stroke: '#ff4444',
      strokeWidth: 2
    }
  },

  bow: {
    name: '弓',
    category: 'weapon',
    attackType: 'ranged',
    damage: 12,
    cooldown: 1.2,
    projectile: {
      radius: 8,
      speed: 400,
      duration: 2.0
    },
    visual: {
      fill: gray,
      // stroke: '#44ff44',
      // strokeWidth: 2
    }
  },

  staff: {
    name: '杖',
    category: 'weapon',
    attackType: 'ranged',
    damage: 20,
    cooldown: 2.0,
    projectile: {
      radius: 12,
      speed: 300,
      duration: 3.0
    },
    visual: {
      fill: 'rgba(255, 100, 255, 0.5)',
      // stroke: '#ff44ff',
      // strokeWidth: 2
    }
  },

  // === モンスター用武器 ===
  claw: {
    name: '爪',
    category: 'weapon',
    attackType: 'melee',
    damage: 8,
    cooldown: 0.8,
    hitbox: {
      radius: 25,
      distance: 30,
      duration: 0.15
    },
    visual: {
      fill: 'rgba(255, 0, 0, 0.2)',
      stroke: '#ff0000',
      strokeWidth: 1
    }
  },

  bite: {
    name: '牙',
    category: 'weapon',
    attackType: 'melee',
    damage: 12,
    cooldown: 1.0,
    hitbox: {
      radius: 20,
      distance: 25,
      duration: 0.2
    },
    visual: {
      fill: 'rgba(255, 50, 50, 0.3)',
      stroke: '#ff3333',
      strokeWidth: 1
    }
  }
};

export const DEFAULT_ITEM = {
  name: '素手',
  category: 'weapon',
  attackType: 'melee',
  damage: 5,
  cooldown: 1.0,
  hitbox: {
    radius: 20,
    distance: 30,
    duration: 0.15
  },
  visual: {
    fill: 'rgba(200, 200, 200, 0.2)',
    stroke: '#888888',
    strokeWidth: 1
  }
};
