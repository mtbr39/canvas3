export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;

    // Drag state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastX = 0;
    this.lastY = 0;

    // Pinch zoom state
    this.isPinching = false;
    this.lastPinchDistance = 0;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    this.canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e));
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.lastX = this.x;
    this.lastY = this.y;
  }

  onMouseMove(e) {
    if (!this.isDragging) return;

    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;

    this.x = this.lastX - dx / this.zoom;
    this.y = this.lastY - dy / this.zoom;
  }

  onMouseUp(e) {
    this.isDragging = false;
  }

  onWheel(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = this.x + mouseX / this.zoom;
    const worldY = this.y + mouseY / this.zoom;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    this.zoom *= zoomFactor;
    this.zoom = Math.max(0.1, Math.min(10, this.zoom));

    this.x = worldX - mouseX / this.zoom;
    this.y = worldY - mouseY / this.zoom;
  }

  onTouchStart(e) {
    e.preventDefault();

    if (e.touches.length === 1) {
      // Single touch - pan
      this.isDragging = true;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
      this.lastX = this.x;
      this.lastY = this.y;
    } else if (e.touches.length === 2) {
      // Two fingers - pinch zoom
      this.isPinching = true;
      this.isDragging = false;
      this.lastPinchDistance = this.getPinchDistance(e.touches);
    }
  }

  onTouchMove(e) {
    e.preventDefault();

    if (this.isDragging && e.touches.length === 1) {
      const dx = e.touches[0].clientX - this.dragStartX;
      const dy = e.touches[0].clientY - this.dragStartY;

      this.x = this.lastX - dx / this.zoom;
      this.y = this.lastY - dy / this.zoom;
    } else if (this.isPinching && e.touches.length === 2) {
      const currentDistance = this.getPinchDistance(e.touches);
      const rect = this.canvas.getBoundingClientRect();

      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      const worldX = this.x + centerX / this.zoom;
      const worldY = this.y + centerY / this.zoom;

      const zoomFactor = currentDistance / this.lastPinchDistance;
      this.zoom *= zoomFactor;
      this.zoom = Math.max(0.1, Math.min(10, this.zoom));

      this.x = worldX - centerX / this.zoom;
      this.y = worldY - centerY / this.zoom;

      this.lastPinchDistance = currentDistance;
    }
  }

  onTouchEnd(e) {
    if (e.touches.length === 0) {
      this.isDragging = false;
      this.isPinching = false;
    } else if (e.touches.length === 1) {
      // Switch back to pan mode
      this.isPinching = false;
      this.isDragging = true;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
      this.lastX = this.x;
      this.lastY = this.y;
    }
  }

  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  apply(ctx) {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx) {
    ctx.restore();
  }

  screenToWorld(screenX, screenY, scale = 1) {
    return {
      x: (screenX / this.zoom + this.x) / scale,
      y: (screenY / this.zoom + this.y) / scale
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom
    };
  }
}
