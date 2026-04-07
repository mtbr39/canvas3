export class QuestHolder {
  constructor() {
    this.entity = null;
    this.currentQuest = null;
    this.originGuild = null;
  }

  hasQuest() {
    return this.currentQuest !== null;
  }

  accept(quest, guildEntity) {
    this.currentQuest = quest;
    this.originGuild = guildEntity;
  }

  complete() {
    this.currentQuest = null;
    this.originGuild = null;
  }
}
