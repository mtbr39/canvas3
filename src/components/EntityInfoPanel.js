import { getStateLabel } from '../core/StateLabel.js';

// ============================================================
// EntityInfoPanel
//   キャンバス上のエンティティ(Human / Monster)をクリックすると
//   画面右側に詳細情報を HTML で表示する。
//
//   情報は「セクション」の集合で組み立てる。新しい情報を出したく
//   なったらセクションを 1 つ追加するだけで済むようにしてある。
//
//   セクションのインタフェース:
//     applies(entity) → boolean   このエンティティに表示すべきか
//     render(entity)  → string    HTML 文字列
//
//   セクションは this.sections の順に並び、applies が true のものだけが描画される。
//   追加: panel.addSection(new MySection())
// ============================================================

const CLICK_THRESHOLD = 5;
const CLICK_RADIUS = 40;

// ---------- セクション群 ----------

class HeaderSection {
  applies() { return true; }
  render(entity) {
    const tag = entity.getComponent('tag');
    let title = '?';
    let subtitle = '';
    let accent = '#85C266';

    if (tag?.hasTag('human')) {
      const combat = entity.getComponent('combat');
      const isAdventurer = !!entity.getComponent('equipment') && combat?.shouldSeekCombat;
      title = isAdventurer ? '冒険者' : '村人';
      subtitle = 'HUMAN';
      accent = isAdventurer ? '#DEF8CE' : '#85C266';
    } else if (tag?.hasTag('monster')) {
      const collider = entity.getComponent('collider');
      const isBoss = collider?.shape?.radius >= 30;
      title = isBoss ? 'ボス' : 'モンスター';
      subtitle = 'MONSTER';
      accent = isBoss ? '#cc6666' : '#dd8866';
    }

    return `
      <div class="eip-header" style="border-bottom-color:${accent}55">
        <div class="eip-title" style="color:${accent}">${title}</div>
        <div class="eip-subtitle">${subtitle}</div>
      </div>
    `;
  }
}

class VitalsSection {
  applies(entity) { return !!entity.getComponent('health'); }
  render(entity) {
    const parts = [];
    const health = entity.getComponent('health');
    if (health) parts.push(this._bar('HP', health.currentHealth, health.maxHealth, '#cc4444'));
    const nutrition = entity.getComponent('nutrition');
    if (nutrition) parts.push(this._bar('栄養', Math.floor(nutrition.current), nutrition.max, '#ccbb44'));
    const vitality = entity.getComponent('vitality');
    if (vitality) parts.push(this._bar('気力', Math.floor(vitality.current), vitality.max, '#6699cc'));
    return `<div class="eip-section eip-vitals">${parts.join('')}</div>`;
  }

  _bar(label, current, max, color) {
    const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
    return `
      <div class="eip-bar-row">
        <div class="eip-bar-label">${label}</div>
        <div class="eip-bar-track">
          <div class="eip-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="eip-bar-val">${current}/${max}</div>
      </div>
    `;
  }
}

class StateSection {
  applies(entity) { return !!entity.getComponent('behavior')?.currentState; }
  render(entity) {
    const state = entity.getComponent('behavior').currentState;
    const label = getStateLabel(state);
    let extra = '';

    if (state.constructor.name === 'EatState' && state.phase) {
      const phaseLabel = state.phase === 'cooking' ? '調理中'
        : state.phase === 'waiting' ? '待機中'
        : state.phase === 'eating' ? '食事中'
        : state.phase;
      extra = `<span class="eip-pill">${phaseLabel}</span>`;
    }

    const combat = entity.getComponent('combat');
    if (combat?.windup) {
      extra += `<span class="eip-pill" style="background:#cc444433;color:#ffaaaa">構え中…</span>`;
    } else if (combat?.isResting && combat.isResting()) {
      extra += `<span class="eip-pill" style="background:#77bb7733;color:#aaddaa">休憩中</span>`;
    }

    return `
      <div class="eip-section">
        <div class="eip-section-label">状態</div>
        <div class="eip-section-body">
          <span class="eip-pill eip-pill-strong">${label}</span>
          ${extra}
        </div>
      </div>
    `;
  }
}

class CombatSection {
  applies(entity) { return !!entity.getComponent('combat'); }
  render(entity) {
    const combat = entity.getComponent('combat');
    const stance = combat.shouldSeekCombat ? '攻撃的' : '防御的';
    const stanceColor = combat.shouldSeekCombat ? '#cc6666' : '#6699cc';
    const range = Math.round(combat.getWeaponRange());

    const equipment = entity.getComponent('equipment');
    let weaponRows = '';
    if (equipment) {
      const weapon = equipment.getWeapon();
      const type = weapon.attackType === 'melee' ? '近接' : '遠隔';
      weaponRows = `
        <div class="eip-kv-row"><span class="eip-kv-k">武器</span><span class="eip-kv-v">${weapon.name ?? '?'} <span class="eip-tag">${type}</span></span></div>
        <div class="eip-kv-row"><span class="eip-kv-k">威力</span><span class="eip-kv-v">${weapon.damage ?? '-'}</span></div>
        <div class="eip-kv-row"><span class="eip-kv-k">射程</span><span class="eip-kv-v">${range}</span></div>
      `;
    }

    return `
      <div class="eip-section">
        <div class="eip-section-label">戦闘</div>
        <div class="eip-section-body">
          <div class="eip-kv-row">
            <span class="eip-kv-k">姿勢</span>
            <span class="eip-kv-v" style="color:${stanceColor}">${stance}</span>
          </div>
          ${weaponRows}
        </div>
      </div>
    `;
  }
}

class QuestSection {
  applies(entity) {
    const q = entity.getComponent('questHolder');
    return !!(q?.hasQuest());
  }
  render(entity) {
    const q = entity.getComponent('questHolder').currentQuest;
    return `
      <div class="eip-section">
        <div class="eip-section-label">クエスト</div>
        <div class="eip-section-body"><span class="eip-pill">${q.name ?? 'クエスト中'}</span></div>
      </div>
    `;
  }
}

class InventorySection {
  applies(entity) {
    const inv = entity.getComponent('inventory');
    return !!inv && !inv.isEmpty();
  }
  render(entity) {
    const inv = entity.getComponent('inventory');
    const counts = new Map();
    for (const item of inv.items) {
      const info = item.getComponent('itemInfo');
      if (!info) continue;
      const key = info.itemType;
      counts.set(key, (counts.get(key) ?? 0) + (info.quantity ?? 1));
    }
    const tiles = [...counts].map(([type, n]) =>
      `<div class="eip-item-tile"><span class="eip-item-name">${type}</span><span class="eip-item-count">×${n}</span></div>`
    ).join('');
    return `
      <div class="eip-section">
        <div class="eip-section-label">所持品 (${inv.getCount()}/${inv.capacity})</div>
        <div class="eip-section-body eip-item-grid">${tiles}</div>
      </div>
    `;
  }
}

class ActionLogSection {
  applies(entity) {
    const log = entity.getComponent('actionLog');
    return !!log && log.entries.length > 0;
  }
  render(entity) {
    const log = entity.getComponent('actionLog');
    // 新しい行動を上に
    const items = [...log.entries].reverse().map((e, i) => {
      const opacity = Math.max(0.3, 1 - i * 0.15);
      return `<div class="eip-log-row" style="opacity:${opacity}">${e.label}</div>`;
    }).join('');
    return `
      <div class="eip-section">
        <div class="eip-section-label">行動履歴</div>
        <div class="eip-section-body">${items}</div>
      </div>
    `;
  }
}

class PartySection {
  applies(entity) {
    const p = entity.getComponent('party');
    return !!p?.isInParty();
  }
  render(entity) {
    const members = entity.getComponent('party').getMembers();
    const alive = members.filter(m => !m.getComponent('health')?.isDead).length;
    return `
      <div class="eip-section">
        <div class="eip-section-label">パーティ</div>
        <div class="eip-section-body">${alive} / ${members.length} 名</div>
      </div>
    `;
  }
}

// ---------- メインクラス ----------

export class EntityInfoPanel {
  constructor() {
    this.game = null;
    this.selectedEntity = null;
    this._panel = null;
    this._body = null;
    this._mouseDownX = 0;
    this._mouseDownY = 0;

    // セクションの登録順 = 表示順。差し替え・追加はここを編集する。
    this.sections = [
      new HeaderSection(),
      new VitalsSection(),
      new StateSection(),
      new CombatSection(),
      new QuestSection(),
      new PartySection(),
      new InventorySection(),
      new ActionLogSection(),
    ];
  }

  // 外部から拡張する用
  addSection(section) { this.sections.push(section); }

  setup() {
    this._injectStyles();
    this._panel = this._createPanel();
    document.body.appendChild(this._panel);

    const canvas = this.game.canvas;
    canvas.addEventListener('mousedown', (e) => {
      this._mouseDownX = e.clientX;
      this._mouseDownY = e.clientY;
    });
    canvas.addEventListener('mouseup', (e) => {
      const dx = e.clientX - this._mouseDownX;
      const dy = e.clientY - this._mouseDownY;
      if (Math.sqrt(dx * dx + dy * dy) >= CLICK_THRESHOLD) return;
      this._handleClick(e.clientX, e.clientY);
    });
  }

  // 毎フレーム呼ばれる: 選択中エンティティの情報をライブ更新
  update() {
    if (!this.selectedEntity) return;
    if (!this.game.entities.includes(this.selectedEntity)) {
      this._hide();
      return;
    }
    this._render();
  }

  _handleClick(clientX, clientY) {
    const rect = this.game.canvas.getBoundingClientRect();
    const scale = this.game.graphics.scale;
    const world = this.game.camera.screenToWorld(clientX - rect.left, clientY - rect.top, scale);
    const entity = this.findEntityAt(world.x, world.y);
    if (!entity) { this._hide(); return; }

    this.selectedEntity = entity;
    this._panel.style.display = 'block';
    this._render();
  }

  // 公開: 指定ワールド座標近傍の human / monster を返す（なければ null）
  findEntityAt(worldX, worldY) {
    const candidates = this.game.spatialQuery.findNearbyEntities(
      this.game.entities, worldX, worldY, CLICK_RADIUS,
      (e) => {
        const t = e.getComponent('tag');
        return !!t && (t.hasTag('human') || t.hasTag('monster'));
      }
    );
    return candidates.length > 0 ? candidates[0].entity : null;
  }

  // 公開: エンティティに対するパネル HTML を組み立てる（applies が true のセクションを連結）
  buildContent(entity) {
    return this.sections
      .filter(s => s.applies(entity))
      .map(s => s.render(entity))
      .join('');
  }

  _render() {
    if (!this.selectedEntity || !this._body) return;
    this._body.innerHTML = this.buildContent(this.selectedEntity);
  }

  _hide() {
    this.selectedEntity = null;
    if (this._panel) this._panel.style.display = 'none';
  }

  _createPanel() {
    const panel = document.createElement('div');
    panel.className = 'eip-panel';
    panel.style.display = 'none';
    const body = document.createElement('div');
    body.className = 'eip-body';
    panel.appendChild(body);
    this._body = body;
    return panel;
  }

  _injectStyles() {
    if (document.getElementById('eip-styles')) return;
    const style = document.createElement('style');
    style.id = 'eip-styles';
    style.textContent = `
      .eip-panel {
        position: fixed;
        top: 16px;
        right: 16px;
        width: 300px;
        max-height: calc(100vh - 32px);
        overflow-y: auto;
        background: rgba(18, 32, 22, 0.92);
        border: 1px solid #85C266;
        border-radius: 8px;
        color: #DEF8CE;
        font-family: 'Helvetica Neue', 'Hiragino Sans', Arial, sans-serif;
        font-size: 12px;
        line-height: 1.5;
        pointer-events: none;
        z-index: 100;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(6px);
      }
      .eip-body { padding: 14px 16px; }

      .eip-header {
        border-bottom: 1px solid;
        padding-bottom: 8px;
        margin-bottom: 12px;
      }
      .eip-title { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
      .eip-subtitle { font-size: 10px; color: #85C266; letter-spacing: 2px; }

      .eip-section { margin-top: 12px; }
      .eip-section-label {
        font-size: 10px;
        color: #85C266;
        letter-spacing: 2px;
        margin-bottom: 6px;
      }
      .eip-section-body { font-size: 12px; }

      .eip-vitals .eip-bar-row + .eip-bar-row { margin-top: 4px; }
      .eip-bar-row {
        display: grid;
        grid-template-columns: 32px 1fr 56px;
        align-items: center;
        gap: 8px;
      }
      .eip-bar-label { color: #85C266; font-size: 11px; }
      .eip-bar-track {
        height: 9px;
        background: rgba(0, 0, 0, 0.45);
        border-radius: 5px;
        overflow: hidden;
        border: 1px solid rgba(133, 194, 102, 0.25);
      }
      .eip-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.25s ease;
        box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.2);
      }
      .eip-bar-val {
        font-size: 10px;
        color: #aaccaa;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      .eip-pill {
        display: inline-block;
        padding: 3px 9px;
        margin: 2px 4px 2px 0;
        border-radius: 11px;
        background: rgba(133, 194, 102, 0.15);
        color: #DEF8CE;
        font-size: 11px;
      }
      .eip-pill-strong {
        background: #85C266;
        color: #14201A;
        font-weight: 600;
      }

      .eip-kv-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        border-bottom: 1px dashed rgba(133, 194, 102, 0.15);
      }
      .eip-kv-row:last-child { border-bottom: none; }
      .eip-kv-k { color: #85C266; font-size: 11px; }
      .eip-kv-v { color: #DEF8CE; font-variant-numeric: tabular-nums; }
      .eip-tag {
        font-size: 10px;
        padding: 1px 5px;
        margin-left: 4px;
        border-radius: 3px;
        background: rgba(133, 194, 102, 0.2);
        color: #85C266;
      }

      .eip-item-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
      }
      .eip-item-tile {
        background: rgba(133, 194, 102, 0.1);
        border: 1px solid rgba(133, 194, 102, 0.25);
        border-radius: 4px;
        padding: 5px 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
      }
      .eip-item-name { color: #DEF8CE; }
      .eip-item-count { color: #85C266; font-variant-numeric: tabular-nums; }

      .eip-log-row {
        font-size: 11px;
        color: #aaccaa;
        padding: 1px 0;
      }
    `;
    document.head.appendChild(style);
  }
}
