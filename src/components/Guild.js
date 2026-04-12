import createItem from '../entities/Item.js';
import { give } from './ItemExchanger.js';
import { createBoss } from '../entities/Monster.js';

const NEARBY_FIELD_RANGE = 5000;

export class Guild {
  constructor() {
    this.entity = null;
    this.quests = [];
    this.maxQuests = 3;
    this.refreshTimer = 0;
    this.refreshInterval = 30;
    this._questIdCounter = 0;
  }

  update() {
    this.refreshTimer -= this.entity.game.deltaTime;
    if (this.refreshTimer <= 0) {
      this.refreshTimer = this.refreshInterval;
      this._refreshQuests();
    }
  }

  getAvailableQuest() {
    this._refreshQuests();
    return this.quests.find(q => q.status === 'available') ?? null;
  }

  acceptQuest(quest, partyId) {
    quest.status = 'active';
    quest.acceptedByPartyId = partyId;
  }

  completeQuest(quest, entity) {
    quest.status = 'completed';
    const inventory = entity.getComponent('inventory');
    if (!inventory) return;

    const transform = entity.getComponent('transform');
    const reward = createItem(transform.x, transform.y, 'coin');
    reward.getComponent('itemInfo').quantity = quest.reward.coins;
    give(reward, inventory);
  }

  _refreshQuests() {
    this.quests = this.quests.filter(q => {
      if (q.status === 'completed') return false;
      const health = q.targetEntity?.getComponent('health');
      return health && !health.isDead;
    });

    while (this.quests.length < this.maxQuests) {
      const quest = this._generateQuest();
      if (!quest) break;
      this.quests.push(quest);
    }
  }

  _generateQuest() {
    const game = this.entity.game;

    const occupiedFields = new Set(this.quests.map(q => q.fieldEntity));
    for (const e of game.entities) {
      const guild = e.getComponent('guild');
      if (guild && guild !== this) {
        for (const q of guild.quests) {
          occupiedFields.add(q.fieldEntity);
        }
      }
    }

    const guildPos = this.entity.getComponent('transform');
    const fieldCandidates = game.entities.filter(e => {
      if (!e.getComponent('fieldSpawner') || occupiedFields.has(e)) return false;
      const ft = e.getComponent('transform');
      const dx = ft.x - guildPos.x;
      const dy = ft.y - guildPos.y;
      return Math.hypot(dx, dy) <= NEARBY_FIELD_RANGE;
    });

    if (fieldCandidates.length === 0) return null;
    const field = fieldCandidates[Math.floor(Math.random() * fieldCandidates.length)];

    const t = field.getComponent('transform');
    const c = field.getComponent('collider');
    const hw = c.shape.width / 2;
    const hh = c.shape.height / 2;
    const bx = t.x + (Math.random() * 2 - 1) * hw;
    const by = t.y + (Math.random() * 2 - 1) * hh;

    const boss = createBoss(bx, by);
    boss.getComponent('tag').add('boss');
    boss.getComponent('fieldBound').setBounds(t.x, t.y, hw, hh);
    boss.getComponent('pulseEffect').show();
    game.addEntity(boss);

    return {
      id: this._questIdCounter++,
      targetEntity: boss,
      fieldEntity: field,
      reward: { coins: 30 + Math.floor(Math.random() * 30) },
      status: 'available',
      acceptedByPartyId: null,
    };
  }
}
