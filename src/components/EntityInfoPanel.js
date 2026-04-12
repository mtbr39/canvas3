import { getStateLabel } from '../core/StateLabel.js';

const CLICK_THRESHOLD = 5;
const CLICK_RADIUS = 40;

export class EntityInfoPanel {
  constructor() {
    this.game = null;
    this.selectedEntity = null;
    this._panel = null;
    this._mouseDownX = 0;
    this._mouseDownY = 0;
  }

  // canvas にイベントを登録して HTML パネルを body に追加する
  // Node.js 環境（テスト）では呼ばない
  setup() {
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

  _handleClick(clientX, clientY) {
    const rect = this.game.canvas.getBoundingClientRect();
    const scale = this.game.graphics.scale;
    const world = this.game.camera.screenToWorld(clientX - rect.left, clientY - rect.top, scale);
    const entity = this.findHumanAt(world.x, world.y);

    if (!entity) {
      this._hide();
      return;
    }

    this.selectedEntity = entity;
    this._panel.style.display = 'block';
    this._panel.innerHTML = this.buildContent(entity);

    const panelW = 220;
    const panelH = this._panel.offsetHeight;
    const x = Math.min(clientX + 12, window.innerWidth - panelW - 8);
    const y = Math.min(clientY + 12, window.innerHeight - panelH - 8);
    this._panel.style.left = `${x}px`;
    this._panel.style.top = `${y}px`;
  }

  _hide() {
    this.selectedEntity = null;
    if (this._panel) this._panel.style.display = 'none';
  }


  // クリック位置 (world座標) に最も近い human を返す。なければ null
  findHumanAt(worldX, worldY) {
    const nearby = this.game.spatialQuery.findNearbyByTag(
      this.game.entities, worldX, worldY, CLICK_RADIUS, 'human'
    );
    return nearby.length > 0 ? nearby[0].entity : null;
  }

  // エンティティの情報を HTML 文字列で返す
  buildContent(entity) {
    const parts = [];

    const isAdventurer = !!entity.getComponent('equipment');
    parts.push(`<div style="font-weight:bold;font-size:13px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #85C26644">${isAdventurer ? '冒険者' : '村人'}</div>`);

    const health = entity.getComponent('health');
    if (health) parts.push(this._bar('HP', health.currentHealth, health.maxHealth, '#cc4444'));

    const nutrition = entity.getComponent('nutrition');
    if (nutrition) parts.push(this._bar('栄養', Math.floor(nutrition.current), nutrition.max, '#ccbb44'));

    const vitality = entity.getComponent('vitality');
    if (vitality) parts.push(this._bar('気力', Math.floor(vitality.current), vitality.max, '#6699cc'));

    const behavior = entity.getComponent('behavior');
    if (behavior?.currentState) {
      parts.push(this._row('状態', getStateLabel(behavior.currentState)));
    }

    const equipment = entity.getComponent('equipment');
    if (equipment) {
      const weapon = equipment.getItem();
      parts.push(this._row('装備', weapon.name ?? equipment.itemId));
    }

    const questHolder = entity.getComponent('questHolder');
    if (questHolder?.hasQuest()) {
      const q = questHolder.currentQuest;
      parts.push(this._row('クエスト', q.name ?? 'クエスト中'));
    }

    const inventory = entity.getComponent('inventory');
    if (inventory && !inventory.isEmpty()) {
      const names = inventory.items.map(item => {
        const info = item.getComponent('itemInfo');
        return info ? `${info.itemType}${info.quantity > 1 ? ` x${info.quantity}` : ''}` : '?';
      }).join(', ');
      parts.push(this._row('所持品', `<span style="color:#bbddbb;word-break:break-all">${names}</span>`));
    }

    return parts.join('');
  }

  _row(label, value) {
    return `<div style="display:flex;gap:6px;margin-bottom:2px"><span style="color:#85C266;min-width:44px">${label}</span><span>${value}</span></div>`;
  }

  _bar(label, current, max, color) {
    const pct = Math.round((current / max) * 100);
    return `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <span style="color:#85C266;min-width:44px">${label}</span>
        <div style="flex:1;height:6px;background:#1a3320;border-radius:3px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:3px"></div>
        </div>
        <span style="font-size:11px;color:#aaccaa;min-width:40px;text-align:right">${current}/${max}</span>
      </div>`;
  }

  _createPanel() {
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      display: 'none',
      position: 'fixed',
      width: '220px',
      background: 'rgba(20,40,25,0.92)',
      border: '1px solid #85C266',
      borderRadius: '6px',
      padding: '10px 12px',
      color: '#DEF8CE',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.6',
      pointerEvents: 'none',
      zIndex: '100',
      left: '0px',
      top: '0px',
    });
    return panel;
  }
}
