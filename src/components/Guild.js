import createItem from '../entities/Item.js';
import { give } from './ItemExchanger.js';

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
    const existingTargets = new Set(this.quests.map(q => q.targetEntity));

    for (const e of game.entities) {
      const tag = e.getComponent('tag');
      const health = e.getComponent('health');
      if (tag?.hasTag('monster') && health && !health.isDead && !existingTargets.has(e)) {
        return {
          id: this._questIdCounter++,
          targetEntity: e,
          reward: { coins: 30 + Math.floor(Math.random() * 30) },
          status: 'available',
          acceptedByPartyId: null,
        };
      }
    }
    return null;
  }
}
