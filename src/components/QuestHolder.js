export class QuestHolder {
  constructor() {
    this.entity = null;
    this.currentQuest = null;
    this.pendingGuild = null; // go_to_guild フェーズ中に向かうギルド
    this.phase = null; // 'go_to_guild' | 'travel_to_village' | 'check_in' | 'travel_to_target' | 'report'
  }

  isActive() {
    return this.phase !== null;
  }

  hasQuest() {
    return this.currentQuest !== null;
  }

  headTo(guildEntity) {
    this.pendingGuild = guildEntity;
    this.phase = 'go_to_guild';
  }

  accept(quest) {
    this.currentQuest = quest;
    this.pendingGuild = null;
    this.phase = 'travel_to_village';
  }

  advanceTo(phase) {
    this.phase = phase;
  }

  complete() {
    this.currentQuest = null;
    this.pendingGuild = null;
    this.phase = null;
  }
}
