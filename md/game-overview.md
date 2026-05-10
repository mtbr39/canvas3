# Canvas3 — RPG世界シミュレーター

## これは何？

**ずっと続いていく、ひとつのRPG世界**を眺めるシミュレーターです。

プレイヤーが操作するキャラクターはいません。村人も冒険者もモンスターも、それぞれが自分の意思で生活し、戦い、取引し、休む。誰かが倒されてもすぐには消えず、仲間が蘇生に駆けつけ、また世界に戻ってくる。世界の住人が「消費される存在」ではなく「住み続ける存在」であること。これがこのプロジェクトの中心にある考えです。

## 世界の姿

ワールドサイズは 8000 × 4000 の広い平面。ここに以下が配置されます。

- **村** ([generateWorld.js:401](src/world/generateWorld.js#L401)) — 最大3つ。それぞれに名前（北の村・南の村など）が付き、ギルド・宿屋・食料店・素材店が密度に応じて建てられる ([Village.js](src/entities/Village.js))
- **フィールド** — 草原・森。村から遠いほどモンスターが強く・多くなる（distance-based difficulty）([generateWorld.js:443-460](src/world/generateWorld.js#L443-L460))
- **山と道** — 山を迂回する道路網を視認グラフ + Dijkstraで生成。MSTで全村・フィールドを連結し、遠回りすぎるペアにはショートカット道を追加 ([generateWorld.js:122-184](src/world/generateWorld.js#L122-L184))
- **ボス** ([main.js:45-49](src/main.js#L45-L49))
- **背景** — 雲・草・石などのフィールド要素 ([WorldBackdrop.js](src/world/WorldBackdrop.js))

## 住人たちの暮らし

人間は生成時に **冒険者(50%) / 村人(50%)** に分かれます ([Human.js:66](src/entities/Human.js#L66))。違いは「攻撃的な[Combat](src/components/Combat.js)コンポーネントを持つか」だけ。性格や職業は専用クラスではなく、**所持コンポーネントの組み合わせ**で生まれます。

ひとりの人間が日々こなす行動は、すべて [DecisionState](src/states/DecisionState.js) という共通の意思決定ループから選ばれます。

- 仲間が死んでいたら蘇生に向かう ([ReviveState](src/states/ReviveState.js))
- 仲間が戦っていたら加勢する
- 近くにアイテムが落ちていれば拾いに行く ([CollectItemState](src/states/CollectItemState.js))
- お腹が空いていて食料を持っていれば食べる ([EatState](src/states/EatState.js))
- パーティが移動中なら合流する
- 冒険者なら近くのギルドで依頼を受ける → 目的地に向かう → 報告 ([QuestHolder](src/components/QuestHolder.js))
- 戦闘可能で敵が近くにいれば戦う ([CombatState](src/states/CombatState.js))
- 村にいなければ最寄りの村に向かう ([Resident](src/components/Resident.js))
- 売れる素材や食料を持っていれば店で売る ([SellState](src/states/SellState.js))
- 空腹で手持ちがなければ食料を買いに行く ([BuyState](src/states/BuyState.js))
- コインが少なければ狩りに行く ([HuntingState](src/states/HuntingState.js))
- 家があれば帰宅する ([HomeState](src/states/HomeState.js))
- それ以外は休むか散歩する ([IdleState](src/states/IdleState.js) / [WanderState](src/states/WanderState.js))

順序が優先順位そのものです。「冒険者だから戦う」のではなく、戦うコンポーネントを持っていて条件が満たされているから戦う。「村人だから戦わない」のではなく、ただそのコンポーネントを持っていないだけ。

## 主な機能・システム

### 経済
- **インベントリ** ([Inventory.js](src/components/Inventory.js))・**アイテム収集** ([ItemCollector.js](src/components/ItemCollector.js))・**装備** ([Equipment.js](src/components/Equipment.js))
- **店** ([Shop.js](src/components/Shop.js)) — 食料店・素材店。住人が売り買いに来る
- **コイン** — 生成時に3〜10枚。狩りや売却で増え、買い物で減る

### パーティと共同生活
- 1〜4人の[Party](src/components/Party.js)を組んで生まれ、移動・戦闘・食事を共にする
- 調理中の仲間がいれば、空腹でなくても集まる ([DecisionState.js:162-179](src/states/DecisionState.js#L162-L179))

### ギルドとクエスト
- 各村に1つ必ずある[Guild](src/components/Guild.js)が依頼を発行
- 冒険者は依頼を受けて別の村へ移動 → 目標を倒す → 帰還報告
- 報酬の流れがそのまま冒険者の生活を回す

### 戦闘
- 武器ごとに違う[攻撃判定](src/components/AttackHitbox.js) — 剣・斧・弓（[Projectile](src/components/Projectile.js)）・杖など ([Items.js](src/data/Items.js))
- 倒れても消えない([Health.removeOnDeath = false](src/entities/Human.js#L69)) — 仲間が[蘇生](src/states/ReviveState.js)できる
- モンスターは[フィールドごとにスポーン上限](src/components/FieldSpawner.js)あり、勝手に増えすぎない

### 生活パラメータ
- **栄養** ([Nutrition](src/components/Nutrition.js)) — 時間で減り、食事で回復。低いと食事を優先、もっと低いと買い物に出かける
- **活力** ([Vitality](src/components/Vitality.js))
- **住居** ([Resident](src/components/Resident.js)) — 村にチェックインし、宿屋を家にする([Inn](src/components/Inn.js))

### 表現
- カメラのズーム・パン ([Camera.js](src/core/Camera.js))
- ズームインすると名前・HP・状態が表示される ([InfoRenderer.js](src/components/InfoRenderer.js))
- 攻撃・被弾の[FloatingText](src/components/FloatingText.js)、被弾時の[DamageFlash](src/components/DamageFlash.js)、[PulseEffect](src/components/PulseEffect.js)
- エンティティをクリックすると詳細パネル ([EntityInfoPanel.js](src/components/EntityInfoPanel.js))
- 持ち物が体の周りを追従する ([CarriedItemsFollower.js](src/components/CarriedItemsFollower.js))

## 設計思想

- **全エンティティは同じ構造で動く**。プレイヤーとNPCの区別はなく、振る舞いはコンポーネントと状況の組み合わせから生まれる
- **コンポーネントは独立**。お互いを直接つつかず、データと表現は分かれる
- **創発(Emergence)を狙う** — 個別の振る舞いを直接書くのではなく、汎用的な仕組みを重ねて生活を立ち上げる

詳しくは [CLAUDE.md](../CLAUDE.md) と [emergence-roadmap.md](./emergence-roadmap.md) を参照。
