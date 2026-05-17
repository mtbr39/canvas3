// 「誰を敵とみなすか」を司るコンポーネント。
//
// 設計意図:
//   「攻撃された」=「敵」ではない。攻撃を受けたという事実と、相手を敵とみなすかの判断を
//   分離するために存在する。これにより、人間同士が事故でぶつかっても自動で喧嘩にならず、
//   一方で別のきっかけ（侮辱・盗み・縄張りなど）で個別の敵対関係を追加することもできる。
//
// 判定の合成:
//   1. 個別の grudge（怨恨）に登録されていれば敵
//   2. それ以外は派閥（tag）ベースのデフォルト規則（human ↔ monster）
//
// 他のコンポーネントは isHostile() だけを見る。
// 派閥規則も grudge も、ここの中だけで完結させる。
export class Relationship {
  constructor() {
    this.entity = null;
    this.grudges = new WeakSet();
  }

  addGrudge(other) {
    this.grudges.add(other);
  }

  removeGrudge(other) {
    this.grudges.delete(other);
  }

  isHostile(other) {
    if (!other || other === this.entity) return false;
    if (this.grudges.has(other)) return true;
    return this._isFactionHostile(other);
  }

  _isFactionHostile(other) {
    const myTag = this.entity.getComponent('tag');
    const otherTag = other.getComponent('tag');
    if (!myTag || !otherTag) return false;
    if (myTag.hasTag('human') && otherTag.hasTag('monster')) return true;
    if (myTag.hasTag('monster') && otherTag.hasTag('human')) return true;
    return false;
  }
}
