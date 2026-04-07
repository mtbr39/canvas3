# 依頼システム実装計画書

## 概要

ギルドで依頼を受け、パーティで目的のモンスターを討伐する。

---

## 全体フロー

```
今いる村のギルドで依頼受注
  → 目的モンスター周辺の最寄り村へ移動（PartyMoveTo）
  → 村の宿でチェックイン
  → 目的モンスターへ向かう（PartyMoveTo）
    → 途中の敵は自動戦闘（既存のInterruptCheck）
  → 目的モンスター討伐
  → その村のギルドで報告・報酬受取（どのギルドでも可）
```

**ポイント:** 依頼受注はその場で行い、報告はどの村のギルドでもよい。
結果として「出発村で受注 → 目的地近くの村に宿泊 → 討伐 → 同じ村のギルドで報告」という自然な流れになる。

---

## データ構造

### 依頼（Quest）

```javascript
// /src/data/quests.js に定義
{
  id: 'quest_001',
  targetTag: 'monster',          // 討伐対象のタグ（将来的に種別も）
  targetEntity: null,            // 対象エンティティ（受注時にセット）
  reward: { coins: 50 },
  status: 'available'            // 'available' | 'active' | 'completed'
}
```

---

## 新規ファイル

| ファイル | 役割 |
|---|---|
| `/src/components/Guild.js` | ギルドコンポーネント（依頼の管理・受注・完了） |
| `/src/components/QuestHolder.js` | エンティティが現在受けている依頼を保持 |
| `/src/states/QuestState.js` | 依頼フロー全体を管理するステート |

---

## 既存ファイルへの変更

| ファイル | 変更内容 |
|---|---|
| `/src/entities/Building.js` | `guild` ビルディングタイプを追加 |
| `/src/entities/Village.js` | 村にギルドを生成 |
| `/src/entities/Human.js` | `QuestHolder` コンポーネントを追加 |
| `/src/states/DecisionState.js` | `QuestState` への遷移条件を追加 |
| `/src/main.js` | 初期配置でギルドを持つ村を確認 |

---

## コンポーネント設計

### Guild コンポーネント（`/src/components/Guild.js`）

```javascript
class Guild {
  constructor() {
    this.entity = null;
    this.quests = [];           // 受注可能な依頼リスト
    this.maxQuests = 3;
    this.refreshInterval = 60;  // 秒
    this.refreshTimer = 0;
  }

  // 受注可能な依頼を返す（先着1件）
  getAvailableQuest() { ... }

  // 依頼を受注する（statusを'active'に）
  acceptQuest(quest, partyId) { ... }

  // 依頼完了・報酬支払い
  completeQuest(quest, entity) { ... }

  // 定期的に依頼を補充
  update() { ... }
}
```

**依頼の生成ロジック:**
- 現在存在するモンスターエンティティを対象にランダムで生成
- 同じ対象への重複依頼なし

---

### QuestHolder コンポーネント（`/src/components/QuestHolder.js`）

```javascript
class QuestHolder {
  constructor() {
    this.entity = null;
    this.currentQuest = null;   // 受注中の依頼（1件のみ）
    this.originGuild = null;    // 依頼を受けたギルドのエンティティ
  }

  hasQuest() { return this.currentQuest !== null; }
  accept(quest, guildEntity) { ... }
  complete() { ... }
}
```

**パーティとの関係:**
- パーティ全員が同じ依頼を持つ（`accept`時にパーティメンバーに伝播）
- リーダーが決断し、全員に `QuestHolder.accept()` を呼ぶ

---

## ステート設計

### QuestState（`/src/states/QuestState.js`）

依頼フローの各フェーズを `phase` で管理する。

```javascript
class QuestState {
  constructor() {
    this.phase = 'find_guild';
  }
}
```

| phase | やること | 次のphase |
|---|---|---|
| `travel_to_nearest_village` | 目的モンスター周辺の最寄り村にPartyDestinationをセット | `check_in` |
| `check_in` | 村に到着 → `resident.checkIn()` | `travel_to_target` |
| `travel_to_target` | 目的モンスターへPartyDestinationをセット | `hunt_target` |
| `hunt_target` | 目的モンスターに近づいたらCombatState（既存） | `report` |
| `report` | 近くのギルドで完了報告 → 報酬受取 → QuestHolder.complete() | DecisionState |

**移動はすべて既存の `party.setDestination()` を使う。**  
**戦闘は既存の InterruptCheck（CombatState）が自動的に処理する。**

```javascript
// QuestState.update() の骨格
update(entity) {
  const behavior = entity.getComponent('behavior');
  const party = entity.getComponent('party');
  const questHolder = entity.getComponent('questHolder');

  switch (this.phase) {
    case 'travel_to_nearest_village':
      if (!party.hasDestination()) {
        const village = this.findNearestVillageToTarget(entity);
        party.setDestination(village.x, village.y);
      }
      if (this.hasArrivedAtVillage(entity)) {
        this.phase = 'check_in';
      }
      break;
    case 'hunt_target':
      const target = questHolder.currentQuest.targetEntity;

      // 目的モンスターが既に死んでいれば報告フェーズへ
      if (!target || target.getComponent('health')?.isDead) {
        this.phase = 'report';
        break;
      }

      // パーティを目的モンスターへ誘導
      if (!party.hasDestination()) {
        party.setDestination(target.x, target.y);
      }
      break;

    case 'report':
      // 近くのギルドへ向かい、到着したら完了報告・報酬受取
      const guild = this.findNearestGuild(entity);
      if (!party.hasDestination()) {
        party.setDestination(guild.x, guild.y);
      }
      if (this.isAtGuild(entity, guild)) {
        guild.getComponent('guild').completeQuest(questHolder.currentQuest, entity);
        questHolder.complete();
        behavior.changeState(new DecisionState());
      }
      break;
    // ...
  }
}
```

---

## DecisionState への追加

`decideNextState()` に以下を追加（優先度は「パーティ移動」より前）：

```javascript
const questHolder = entity.getComponent('questHolder');

// 依頼受注済み → QuestStateへ
if (questHolder?.hasQuest()) {
  behavior.changeState(new QuestState());
  return;
}

// 冒険者タイプで依頼未受注 → 近くのギルドで受注してQuestStateへ
if (combat?.shouldSeekCombat && !questHolder?.hasQuest()) {
  const guild = findNearestGuild(entity);
  if (guild) {
    const quest = guild.getComponent('guild').getAvailableQuest();
    if (quest) {
      questHolder.accept(quest, guild);  // パーティ全員に伝播
      behavior.changeState(new QuestState());
      return;
    }
  }
}
```

受注処理は `DecisionState` で行うため、`QuestState` は `travel_to_nearest_village` から始められる。

---

## ギルドビルディングの追加

### Building.js への追加

```javascript
case 'guild':
  building.addComponent('guild', new Guild());
  // サイズ: 400×300（Innと同じ）
  break;
```

### Village.js への追加

```javascript
// 村の生成時にギルドを1棟追加
const guild = createBuilding(x, y, 'guild');
buildings.push(guild);
```

---

## 空間クエリのユーティリティ

既存の `SpatialQuery` を使って以下を実装：

```javascript
// 目的モンスターに最も近い村を探す
findNearestVillageToTarget(targetEntity) {
  return game.spatialQuery.findNearest(
    targetEntity.x, targetEntity.y,
    e => e.getComponent('tag')?.hasTag('village')
  );
}

// 近くのギルドを探す（どの村のギルドでも可）
findNearestGuild(entity) {
  return entity.game.spatialQuery.findNearest(
    entity.x, entity.y,
    e => e.getComponent('guild') != null
  );
}
```

---

## パーティとの連携

- **依頼の受注:** パーティリーダーのみギルドで受注処理し、全メンバーに `questHolder.accept()` を伝播
- **フェーズ管理:** 各メンバーが独自の `QuestState` を持つが、`phase` は `party.setDestination()` を通じて間接的に同期される
- **戦闘:** 全員が既存の InterruptCheck → CombatState で対応、完了後は `DecisionState` → `QuestState` に戻る

---

## 実装順序

1. **Guild コンポーネント** — 依頼の生成・受注・完了
2. **QuestHolder コンポーネント** — エンティティへの依頼保持
3. **Building.js に guild タイプ追加**
4. **Village.js にギルド生成を追加**
5. **Human.js に QuestHolder 追加**
6. **QuestState** — `travel_to_nearest_village` 〜 `report` の5フェーズ
7. **DecisionState** — 受注処理と QuestState への遷移条件追加
8. **main.js** — 動作確認

---

## スコープ外（将来課題）

- モンスター種別指定（今回は最寄りの任意モンスター）
- 複数の依頼の管理
- 依頼の失敗条件（タイムアウト、全滅）
- ギルドランク・報酬バリエーション
