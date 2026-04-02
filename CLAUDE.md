# Canvas3 プロジェクト実装方針

## 設計思想

全エンティティは同じ構造（欲求・アクション・パラメータ・コンポーネント）を持ち、同じルールで動く。プレイヤーとNPCに別の仕組みは用意しない。

振る舞いの違いは、エンティティに何が備わっているか（所持品・パラメータ・状態）と、その時の状況によって生まれる。特定の振る舞いを直接コードするのではなく、**汎用的なシステムの組み合わせの結果として振る舞いが生まれる**ことを目指す。

**悪い例（振る舞いを直接コードする）:**
```javascript
class SoldierAI {
  update() {
    this.findEnemy();   // 兵士だから戦う
    this.attackEnemy();
  }
}
```

**良い例（状況とコンポーネントの組み合わせで振る舞いが決まる）:**
```javascript
// DecisionState: 全エンティティ共通の意思決定
decideNextState(entity) {
  // combatコンポーネントを持っていて、敵が近くにいれば戦う
  const combat = entity.getComponent('combat');
  if (combat && combat.shouldSeekCombat && combat.findNearbyEnemy()) {
    behavior.changeState(new CombatState());
    return;
  }

  // nutritionコンポーネントを持っていて、空腹で食料があれば食べる
  const eatState = checkEatCondition(entity);
  if (eatState) {
    behavior.changeState(eatState);
    return;
  }

  // ...
}
```

「戦士」も「一般人」も同じ `DecisionState` を通る。戦士が戦うのは `combat` コンポーネントを持ち `shouldSeekCombat` が true だからであり、一般人が戦わないのはそのコンポーネントを持っていないからに過ぎない。

---

## コンポーネント設計原則

### 1. コンポーネントの独立性
- 各コンポーネントは自身の責任範囲を明確に持つ
- 他のコンポーネントへの依存を最小限にする
- コンポーネント間の依存は一方向にする

**良い例:**
```javascript
// CircleRendererは自身で点滅を管理
class CircleRenderer {
  flash(duration) {
    this.flashTimer = duration;
  }
}

// DamageFlashはCircleRendererのメソッドを呼ぶだけ
class DamageFlash {
  update() {
    const circleRenderer = this.entity.getComponent('circleRenderer');
    if (circleRenderer) {
      circleRenderer.flash(this.duration);
    }
  }
}
```

**悪い例:**
```javascript
// CircleRendererがDamageFlashに依存している
class CircleRenderer {
  render() {
    const damageFlash = this.entity.getComponent('damageFlash');
    if (damageFlash && !damageFlash.visible) return;
    // ...
  }
}
```

### 2. 設定の内部化
- コンポーネントの設定やデフォルト値は内部に持つ
- コンストラクタの引数は最小限にする（できれば引数なしにする）
- 外部から大量のオプションを渡さない
- 設定値（capacity, range, durationなど）はコンストラクタで受け取らず、クラス内で定義する

**良い例:**
```javascript
class Inventory {
  constructor() {
    this.items = [];
    this.capacity = 20;  // 設定値は内部で定義
  }
}

class ItemCollector {
  constructor() {
    this.entity = null;
    this.pickupRange = 30;  // 設定値は内部で定義
    this.autoPickup = false;
  }
}

// 使用時
entity.addComponent('inventory', new Inventory());
entity.addComponent('itemCollector', new ItemCollector());
```

**悪い例:**
```javascript
class Inventory {
  constructor(capacity = 20) {  // 引数で設定値を受け取っている
    this.items = [];
    this.capacity = capacity;
  }
}

// 使用時に引数を渡す必要がある
entity.addComponent('inventory', new Inventory(20));
entity.addComponent('itemCollector', new ItemCollector(30));
```

### 3. メソッドベースの制御
- 状態を直接変更するのではなく、メソッドを通して制御する
- コンポーネントは自身の状態を完全に管理する

**良い例:**
```javascript
class CircleRenderer {
  flash(duration = 0.5) {
    this.flashTimer = duration;
  }

  update() {
    if (this.flashTimer > 0) {
      // 自身で点滅を管理
      this.visible = Math.floor(this.flashTimer * this.flashSpeed) % 2 === 0;
    }
  }
}
```

### 4. データと表現の分離

データを持つコンポーネントは、その表現方法を知らなくていい。`InfoRenderer` が `health` を読むだけで `health` は描画を知らないのと同じ原則。

2つの関心事を同期させたいとき、どちらかに依存を持たせるのではなく、**第三のコンポーネントが橋渡しする**。

**例: インベントリとアイテム追従の分離**

```
Inventory（データ）──(読むだけ)── CarriedItemsFollower ──(操作)── FollowOwner
```

- `Inventory` はアイテムの追加・削除のみ担う
- `CarriedItemsFollower` が毎フレーム inventory を見て FollowOwner を同期する
- 表現を変えたい場合（例：ウィンドウ表示）は `CarriedItemsFollower` を差し替えるだけ。`Inventory` も `FollowOwner` も触らない

**ルール: 他のコンポーネントは `Inventory.add/remove` だけを使う。`FollowOwner` や `CarriedItemsFollower` を直接操作しない。**

### 5. ロジックへの命名

処理の意図が伝わらないロジックはメソッドに切り出して名前をつける。

- 名前で「何をしているか」が伝わるようにする
- 差し替えが想定される部分はさらに別メソッドに切り出す

**良い例:**
```javascript
class InfoRenderer {
  isCameraCloseEnough() {
    return this.entity.game.camera.zoom >= 1.5;
  }

  isVisible() {
    return this.isCameraCloseEnough();
  }

  render() {
    if (!this.isVisible()) return;
    // 描画処理
  }
}
```

**悪い例:**
```javascript
class InfoRenderer {
  render() {
    if (game.camera.zoom < 1.5) return;  // 何のための条件かわからない
    // 描画処理
  }
}
```

## Graphicsクラスの拡張

新しい描画機能が必要な場合は、Graphicsクラスにメソッドを追加する。

```javascript
class Graphics {
  // 既存: circle()

  text(x, y, text, options = {}) {
    // テキスト描画の実装
  }

  // 将来的に追加可能: rect(), line(), etc.
}
```

## エフェクトコンポーネントのパターン

エフェクトコンポーネントは最初から追加しておき、メソッド呼び出しで起動する。

```javascript
class FloatingText {
  constructor() {
    this.timer = 0;
  }

  show(text) {
    this.text = text;
    this.timer = this.duration;
  }

  update() {
    if (this.timer > 0) {
      this.timer -= game.deltaTime;
    }
  }

  render() {
    if (this.timer <= 0) return;
    // 描画処理
  }
}
```

使用例：
```javascript
// エンティティ作成時に追加
entity.addComponent('floatingText', new FloatingText());

// 使用時はメソッドを呼ぶだけ
floatingText.show('攻撃');
```

例：
- `FloatingText.show(text)` - テキスト表示開始
- `CircleRenderer.flash()` - 点滅開始

---

## ファイル構成

```
src/
├── core/           # コアシステム (Game, Entity, Graphics, Camera)
├── components/     # 再利用可能なコンポーネント
├── entities/       # エンティティファクトリ (createHuman, createMonster)
└── states/         # AIステート
```

## コーディングスタイル

- シンプルさを優先する
- 過度な抽象化を避ける
- 必要になってから機能を追加する
- コメントは最小限に（コード自体を読みやすく書く）
