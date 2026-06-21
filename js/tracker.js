import { Store } from './store.js';
import { showToast } from './app.js';

export const TrackerView = {
  container: null,
  canvas: null,
  ctx: null,
  animationId: null,
  simulationInterval: null,

  init(container) {
    this.container = container;
  },

  render(state) {
    if (!this.container) return;

    // Find the latest active order or the most recent delivered one
    const activeOrder = state.orders.find(o => o.status !== 'delivered') || state.orders[0];

    if (!activeOrder) {
      this.container.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 60px 40px;">
          <i class="fa-solid fa-map-location-dot" style="font-size: 64px; color: rgba(255,255,255,0.05); margin-bottom: 20px;"></i>
          <h2 style="font-family: var(--font-tech); text-transform: uppercase;">No Deliveries to Track</h2>
          <p style="color: var(--pepsi-text-secondary); max-width: 400px; margin: 10px auto 24px;">
            You do not have any active or past delivery orders. Order some cold, refreshing Pepsi first!
          </p>
          <a href="#catalog" class="btn-primary" style="display: inline-flex;">Go to Catalog</a>
        </div>
      `;
      this.stopAnimation();
      return;
    }

    const itemsText = activeOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

    this.container.innerHTML = `
      <div class="tracking-container">
        
        <!-- Live Map Visualizer -->
        <div class="glass-card map-card">
          <div class="glass-card-header" style="position: absolute; top: 16px; left: 20px; right: 20px; z-index: 10; pointer-events: none;">
            <h3 class="glass-card-title" style="background: rgba(13,18,36,0.85); padding: 8px 16px; border-radius: var(--border-radius-sm); border: 1px solid var(--pepsi-glass-border); width: fit-content; pointer-events: auto;">
              <i class="fa-solid fa-satellite-dish" style="animation: pulse 1.5s infinite;"></i>
              <span>Eco-Scooter Tracker</span>
            </h3>
          </div>
          
          <canvas id="tracker-map" class="mock-map-canvas"></canvas>
          
          <div class="map-overlay-stats">
            <div class="map-stat-col">
              <span class="map-stat-lbl">Transit Vehicle</span>
              <span class="map-stat-val" style="color: var(--neon-blue);"><i class="fa-solid fa-motorcycle"></i> Pep-Scooter #402</span>
            </div>
            <div class="map-stat-col">
              <span class="map-stat-lbl">Fuel Mode</span>
              <span class="map-stat-val" style="color: var(--neon-green);"><i class="fa-solid fa-bolt"></i> 100% Electric</span>
            </div>
            <div class="map-stat-col">
              <span class="map-stat-lbl">Rider Assigned</span>
              <span class="map-stat-val" style="color: white;">
                ${activeOrder.rider ? activeOrder.rider : '<span class="color-warning">Waiting for Rider</span>'}
              </span>
            </div>
          </div>
        </div>

        <!-- Order details & status line -->
        <div style="display: flex; flex-direction: column; gap: 30px;">
          
          <div class="glass-card tracking-status-card">
            <div style="border-bottom: 1px solid var(--pepsi-glass-border); padding-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-family: var(--font-tech); font-weight: 800; font-size: 16px; color: white;">Order #${activeOrder.id}</span>
                <span class="nav-badge" style="position: static; ${activeOrder.status === 'delivered' ? 'background: var(--color-success)' : ''}">
                  ${activeOrder.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p style="font-size: 13px; color: var(--pepsi-text-secondary); margin-top: 6px;">
                <strong>Deliver To:</strong> ${activeOrder.address}
              </p>
              <p style="font-size: 12px; color: var(--pepsi-text-secondary); margin-top: 4px;">
                <strong>Items:</strong> ${itemsText}
              </p>
            </div>

            <!-- Steps -->
            <div class="tracking-timeline">
              <!-- Timeline fill height based on active index -->
              <div class="timeline-progress-fill" style="height: ${this.getTimelineHeightPercent(activeOrder.status)}%;"></div>
              
              <div class="timeline-step ${this.getStepClass(activeOrder.status, 'placed')}">
                <span class="step-title">Order Placed</span>
                <span class="step-desc">${this.getStatusTime(activeOrder, 'placed') || 'Awaiting confirmation'}</span>
              </div>
              
              <div class="timeline-step ${this.getStepClass(activeOrder.status, 'preparing')}">
                <span class="step-title">Pepsi Bottling &amp; Packing</span>
                <span class="step-desc">${this.getStatusTime(activeOrder, 'preparing') || 'Preparing items at warehouse'}</span>
              </div>
              
              <div class="timeline-step ${this.getStepClass(activeOrder.status, 'out_for_delivery')}">
                <span class="step-title">Electric Scooter Dispatch</span>
                <span class="step-desc">${this.getStatusTime(activeOrder, 'out_for_delivery') || 'Optimizing rider path...'}</span>
              </div>
              
              <div class="timeline-step ${this.getStepClass(activeOrder.status, 'delivered')}">
                <span class="step-title">Delivered</span>
                <span class="step-desc">${this.getStatusTime(activeOrder, 'delivered') || 'Delivered zero carbon'}</span>
              </div>
            </div>
          </div>
          
          <!-- Carbon Saved Stat Box -->
          <div class="glass-card" style="background: linear-gradient(135deg, rgba(57, 255, 20, 0.05), transparent), var(--pepsi-dark-card);">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div class="widget-icon icon-green">
                <i class="fa-solid fa-leaf"></i>
              </div>
              <div>
                <h4 style="font-size: 15px; font-weight: 700; text-transform: uppercase;">Carbon Savings Offset</h4>
                <p style="font-size: 12px; color: var(--pepsi-text-secondary); margin-top: 2px;">
                  By choosing electric scooter delivery, you offset <strong>0.12 kg</strong> of CO₂ emissions.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    // Start Map Drawing & Update Loops
    this.initMap(activeOrder);
    this.startSimulation(activeOrder);
  },

  getStepClass(currentStatus, stepName) {
    const statuses = ['placed', 'preparing', 'out_for_delivery', 'delivered'];
    const currentIdx = statuses.indexOf(currentStatus);
    const stepIdx = statuses.indexOf(stepName);

    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'active';
    return '';
  },

  getTimelineHeightPercent(status) {
    if (status === 'placed') return 0;
    if (status === 'preparing') return 33;
    if (status === 'out_for_delivery') return 66;
    if (status === 'delivered') return 100;
    return 0;
  },

  getStatusTime(order, status) {
    const record = order.statusHistory.find(h => h.status === status);
    return record ? `Ready at ${record.time}` : '';
  },

  // Map Rendering logic
  initMap(order) {
    this.canvas = document.getElementById('tracker-map');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Set internal resolution
    this.canvas.width = 600;
    this.canvas.height = 450;

    this.stopAnimation();
    this.animateMap(order);
  },

  animateMap(order) {
    const draw = () => {
      if (!this.canvas || !this.ctx) return;
      const width = this.canvas.width;
      const height = this.canvas.height;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Grid Background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Simulated Streets
      ctx.strokeStyle = 'rgba(13, 30, 68, 0.4)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const streets = [
        [{x: 50, y: 50}, {x: 550, y: 50}],
        [{x: 50, y: 220}, {x: 550, y: 220}],
        [{x: 50, y: 400}, {x: 550, y: 400}],
        [{x: 100, y: 50}, {x: 100, y: 400}],
        [{x: 300, y: 50}, {x: 300, y: 400}],
        [{x: 500, y: 50}, {x: 500, y: 400}]
      ];

      streets.forEach(street => {
        ctx.beginPath();
        ctx.moveTo(street[0].x, street[0].y);
        ctx.lineTo(street[1].x, street[1].y);
        ctx.stroke();
      });

      // 3. Draw Scooter Travel Path (Dotted Neon Line)
      // Scale coordinates from 200x200 space to canvas coordinates
      const scaleX = (x) => 50 + (x / 200) * 500;
      const scaleY = (y) => 50 + (y / 200) * 350;

      const path = order.mapPath;
      if (path && path.length > 0) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(scaleX(path[0].x), scaleY(path[0].y));
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(scaleX(path[i].x), scaleY(path[i].y));
        }
        ctx.stroke();
        ctx.setLineDash([]); // reset
      }

      // 4. Draw Warehouse Node (Pepsi Hub)
      const wX = scaleX(path[0].x);
      const wY = scaleY(path[0].y);
      ctx.fillStyle = '#004B87';
      ctx.strokeStyle = 'var(--neon-blue)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'var(--neon-blue)';
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.arc(wX, wY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('PEPSI HUB', wX, wY - 20);

      // 5. Draw Customer Node (Destination)
      const cX = scaleX(path[path.length - 1].x);
      const cY = scaleY(path[path.length - 1].y);
      
      ctx.fillStyle = '#E31B23';
      ctx.strokeStyle = 'var(--neon-red)';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'var(--neon-red)';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.arc(cX, cY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      ctx.fillStyle = '#fff';
      ctx.fillText('YOU', cX, cY - 20);

      // 6. Draw Rider (Scooter Position along the path)
      if (order.status !== 'placed' && order.status !== 'preparing') {
        const scooterPos = this.getScooterPosition(path, order.deliveryProgress);
        const sX = scaleX(scooterPos.x);
        const sY = scaleY(scooterPos.y);

        // Pulsing glowing circle
        const pulse = Math.abs(Math.sin(Date.now() / 150)) * 6;
        ctx.fillStyle = 'var(--neon-blue)';
        ctx.shadowColor = 'var(--neon-blue)';
        ctx.shadowBlur = 12 + pulse;
        
        ctx.beginPath();
        ctx.arc(sX, sY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Draw miniature scooter/arrow indicator showing direction
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sX, sY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      this.animationId = requestAnimationFrame(draw);
    };

    draw();
  },

  getScooterPosition(path, progress) {
    if (progress <= 0) return path[0];
    if (progress >= 100) return path[path.length - 1];

    // Total distance of segment path
    const getDist = (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    
    let totalLen = 0;
    const lengths = [];
    for (let i = 0; i < path.length - 1; i++) {
      const len = getDist(path[i], path[i+1]);
      lengths.push(len);
      totalLen += len;
    }

    const targetDist = totalLen * (progress / 100);
    
    let runningDist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      if (runningDist + lengths[i] >= targetDist) {
        // Point is on this segment
        const segmentProgress = (targetDist - runningDist) / lengths[i];
        const p1 = path[i];
        const p2 = path[i+1];
        return {
          x: p1.x + (p2.x - p1.x) * segmentProgress,
          y: p1.y + (p2.y - p1.y) * segmentProgress
        };
      }
      runningDist += lengths[i];
    }

    return path[path.length - 1];
  },

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  },

  // AUTO-SIMULATOR: Progresses the order in background if no rider handles it manually
  startSimulation(order) {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    // Only simulate if not already delivered
    if (order.status === 'delivered') return;

    this.simulationInterval = setInterval(() => {
      // Re-fetch order from state store to check for external updates (e.g. from Rider Dashboard)
      const currentOrder = Store.state.orders.find(o => o.id === order.id);
      if (!currentOrder || currentOrder.status === 'delivered') {
        clearInterval(this.simulationInterval);
        this.render(Store.state);
        return;
      }

      // Customer Mode Simulated progression
      // 1. Placed -> Preparing
      if (currentOrder.status === 'placed') {
        // Automatically accept and assign rider after 8 seconds
        setTimeout(() => {
          if (currentOrder.status === 'placed') {
            currentOrder.rider = 'Simulated Volt Rider';
            Store.updateOrderStatus(currentOrder.id, 'preparing');
            showToast('Order Accepted', `Rider assigned to order ${currentOrder.id}.`, 'info');
            this.render(Store.state);
          }
        }, 8000);
      }

      // 2. Preparing -> Out for Delivery
      if (currentOrder.status === 'preparing') {
        // Move to out for delivery after 10 seconds in preparing
        setTimeout(() => {
          if (currentOrder.status === 'preparing') {
            Store.updateOrderStatus(currentOrder.id, 'out_for_delivery');
            showToast('Order Out for Delivery', `Rider is on the way with your Pepsi!`, 'success');
            this.render(Store.state);
          }
        }, 10000);
      }

      // 3. Increment Delivery Progress when Out for Delivery
      if (currentOrder.status === 'out_for_delivery') {
        const nextProgress = Math.min(100, currentOrder.deliveryProgress + 2);
        Store.updateOrderProgress(currentOrder.id, nextProgress);
        
        if (nextProgress >= 100) {
          clearInterval(this.simulationInterval);
          showToast('Order Delivered!', 'Your cold Pepsi has arrived. Enjoy!', 'success');
          // Add carbon offset success points
          Store.state.userStats.points += 5; // Eco points for choosing green delivery
          Store.save();
        }
        
        // Re-render only progress values and map scooter position
        const progBar = this.container.querySelector('.timeline-progress-fill');
        if (progBar) {
          progBar.style.height = `${this.getTimelineHeightPercent(currentOrder.status)}%`;
        }
        const progressPercentEl = this.container.querySelector('.timeline-step.active .step-desc');
        if (progressPercentEl && currentOrder.status === 'out_for_delivery') {
          progressPercentEl.textContent = `Transit progress: ${Math.round(nextProgress)}%`;
        }
      }
    }, 1000);
  },

  destroy() {
    this.stopAnimation();
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
  }
};
