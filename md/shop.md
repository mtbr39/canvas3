
## 売買システム

### 概要

エンティティは欲求（栄養値）に基づいて自律的に買い物を行う。お金の概念はなく、ショップに在庫があれば取引が成立する。

### 条件

`DecisionState` の意思決定の中で判断される：

- `nutrition.ratio <= 0.6`（栄養60%以下）
- インベントリに食料がない

両方を満たすと `BuyFoodState` に遷移する。

### BuyFoodState のフロー

1. `enter`: 最寄りの食料あり Shop を探す → 移動開始
2. 到着: `shop.buy()` で 1〜3 個購入 → `DecisionState` へ
3. Shop が見つからない場合: そのまま `DecisionState` へ戻る

### 関連コンポーネント・ファイル

| ファイル | 役割 |
|---|---|
| `states/BuyState.js` | 買い物ステート本体（カテゴリ指定で汎用利用可能） |
| `states/DecisionState.js` | 買い物判断のトリガー |
| `components/Shop.js` | `getItemsForSale()` / `buy()` |
| `components/Nutrition.js` | `ratio` で空腹度を管理 |

### 優先順位

`DecisionState` 内での判断順：

1. アイテム収集（近くに落ちていれば）
2. 食事（食料持参 & 栄養40%以下）
3. **食料購入（食料なし & 栄養60%以下）** ← ここ
4. パーティ行動・帰宅・徘徊