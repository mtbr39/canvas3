const ROAD_WIDTH = 80;
const ROAD_COLOR = '#c8a96e';

export class RoadRenderer {
  constructor() {
    this.entity = null;
    this.color = ROAD_COLOR;
    this.width = ROAD_WIDTH;
  }

  render() {
    const game = this.entity.game;
    const roadPath = this.entity.getComponent('roadPath');
    if (!roadPath) return;

    const pts = roadPath.waypoints;
    const radius = this.width / 2;

    for (let i = 0; i < pts.length - 1; i++) {
      game.graphics.line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, {
        stroke: this.color,
        strokeWidth: this.width,
        worldSpace: true,
      });
    }

    for (const pt of pts) {
      game.graphics.circle(pt.x, pt.y, radius, { fill: this.color });
    }
  }
}
