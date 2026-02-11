# Canvas3 プロジェクト実装方針

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
- コンストラクタの引数は最小限にする
- 外部から大量のオプションを渡さない

**良い例:**
```javascript
class TextRenderer {
  constructor() {
    this.entity = null;
  }

  render() {
    // 設定は内部で管理
    const text = `${health.currentHealth}/${health.maxHealth}`;
    game.graphics.text(x, y, text, {
      fill: '#000000',
      fontSize: 12
    });
  }
}

// 使用時
entity.addComponent('textRenderer', new TextRenderer());
```

**悪い例:**
```javascript
// 使用時に大量の引数を渡す
entity.addComponent('textRenderer', new TextRenderer(
  (entity) => { /* ... */ },
  0, 35,
  { fill: '#00ff00', stroke: '#000000', strokeWidth: 3, fontSize: 12 }
));
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
