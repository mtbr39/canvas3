# 世界の見た目の設計

## 全体方針

世界を構成する地形は **3種**：草原・森・町。山や荒野などは作らず、少ない要素を作り込んで魅力を出す。
RPGのワールドマップ的な**記号化された見た目**を目指し、リアル質感は狙わない。

主役は **草の動き**。地面・木・石は静かに支える。だから GroundTint は大人しく、TreeField / StoneField はクラスタで疎に置き、Grass だけが揺れる。

---

## レイヤー構成

描画順は **GroundTint → Grass → Stone → Tree → 既存エンティティ**。
すべて [src/world/WorldBackdrop.js](../src/world/WorldBackdrop.js) が一括で生成・配置する。

### GroundTint（地面色のムラ）

[src/components/GroundTint.js](../src/components/GroundTint.js)

- 600px の大きめタイル × 4段階の緑グラデーション
- 色は1つの「最も淡い色」から HSL で暗さ+彩度を段階的に上げて生成。**1色の差し替えで全体の調子が揃う**
- オーバードローでタイルの継ぎ目をぼかす
- **狙い**：背景単色だと「板」になる。ごく薄いムラで「広がり」を出す。主役じゃないので主張しない

### Grass（草）

[src/components/GrassField.js](../src/components/GrassField.js)

- 三角形 + 風揺れアニメ（Perlin包絡 × sine carrier）
- 半透明（alpha 0.4）で地面に溶け込む
- ビューポートカリング + `minZoom` ゲート — 引いた視点では描画しない
- **狙い**：世界が「生きている」ことを見せる主役。風が吹いている世界の表現は草だけの仕事

### StoneField（石）

[src/components/StoneField.js](../src/components/StoneField.js)

- 白〜淡灰の不定形ポリゴン（6-9頂点、頂点ジッタで歪み）
- **クラスタ配置**：Perlinで「石が集まる場所」を決め、その中に1-3個
- **Poisson-disk的な近接抑制**（`minGapFactor`）で石同士が重ならない
- サイズは 26-170 の一様乱数（小石から巨石まで幅広く）
- 影 + 薄い輪郭
- **狙い**：カルスト台地の点在する白石。広がりの中の巨石がランドマーク的に効く

### TreeField（木）

[src/components/TreeField.js](../src/components/TreeField.js)

- 暗い緑の円 + 影。シンプルな記号
- **2層Perlin**：
  - マクロ（森エリアの大きな塊） × マイクロ（森内の密度ムラ）
  - 「森と開けた場所」「森内の濃淡」の両方を表現
- Yソートで奥行き感
- `maxDensity` で最濃地点でも詰めすぎない
- **狙い**：草原との対比。色の濃さと密度で「ここは違う場所」と一目で分かる

---

## WorldBackdrop（責務集約）

[src/world/WorldBackdrop.js](../src/world/WorldBackdrop.js)

「世界の地形デザイン」を1か所に集約。

- **ワールドサイズ** (`WORLD_WIDTH`, `WORLD_HEIGHT`) を一元管理
- 「石が多い場所」「木が多い場所」を表す **バイオームマップ**（PerlinNoise）を生成し、各 Field の `biomeSampler` に注入
- 石用シードと木用シードを独立にすることで、両方が重なる場所・どちらか片方の場所・どちらもない場所が自然に生まれる
- z-order の挿入順もここで決める

新しいレイヤー（湖、遺跡など）を足すときもここに集約できる。

---

## コンポーネント設計の共通方針

CLAUDE.md の設計原則に沿う：

- **同じパターンで4つを書く**：Perlinノイズ + グリッドクラスタ配置 + 自身で描画。GrassField の構造を雛形にして横展開
- **設定は内部、座標系の事実だけ外部から**：`worldWidth/Height` とバイオームサンプラだけ WorldBackdrop が注入。見た目パラメータは各コンポーネント内に持つ
- **「何もない場所」を許す**：閾値で空白地を作る。詰めすぎないことで密な場所が際立つ

---

## 既存システムとの関係

- [src/world/generateWorld.js](../src/world/generateWorld.js) は村・フィールド・道などを生成。`WORLD_WIDTH/HEIGHT` を WorldBackdrop からimport
- 山と道は `GENERATE_MOUNTAINS` / `GENERATE_ROADS` フラグで無効化可能（現在 false）
- 矩形フィールド（grassland/forest）の境界線は薄く、見た目は背景レイヤーが担う

---

## 主要な調整パラメータ

| 項目 | ファイル | パラメータ |
|---|---|---|
| ワールドサイズ | WorldBackdrop.js | `WORLD_WIDTH`, `WORLD_HEIGHT` |
| バイオームの塊の大きさ | WorldBackdrop.js | `BIOME_SCALE` |
| 草の密度 / 描画距離 | GrassField.js | `cellSize`, `minZoom` |
| 草の揺れ | GrassField.js | `swayAmplitude`, `envelopeSpeed` |
| 石の出現範囲 | StoneField.js | `clusterThreshold` |
| 石のサイズレンジ | StoneField.js | `radiusMin`, `radiusMax` |
| 木の濃度上限 | TreeField.js | `maxDensity` |
| 森エリアの広さ | TreeField.js | `macroThreshold` |
| 地面の色味 | GroundTint.js | `colors`（lightest を変えると全体が変わる） |
