import { Store } from './store.js';
import { showToast } from './app.js';

export const RiderView = {
  container: null,
  canvas: null,
  ctx: null,
  animationId: null,
  isOptimizing: false,
  gridNodes: [],
  gridLinks: [],
  optimizedPath: [],
  exploredNodes: [],
  activeRiderOrder: null,
  simulationInterval: null,

  init(container) {
    this.container = container;
  },

  render(state) {
    if (!this.container) return;

    // In a real system, the rider is a separate role, but here we can manage an active order 
    // that the user has accepted in rider mode.
    this.activeRiderOrder = state.orders.find(o => o.status !== 'delivered' && o.rider === 'Courier You') 
      || state.orders.find(o => o.id === state.activeRiderOrder);

    const pendingOrders = state.orders.filter(o => o.status === 'placed');

    this.container.innerHTML = `
      <div class="rider-grid">
        
        <!-- Left Column: Job Queue & Active Job -->
        <div style="display: flex; flex-direction: column; gap: 30px;">
          
          <!-- Active Job Card -->
          <div class="glass-card">
            <div class="glass-card-header">
              <h3 class="glass-card-title">
                <i class="fa-solid fa-clipboard-list" style="color: var(--neon-blue);"></i>
                <span>Active Delivery Duty</span>
              </h3>
            </div>
            
            <div id="rider-active-job-content">
              ${this.getActiveJobHtml(this.activeRiderOrder)}
            </div>
          </div>

          <!-- Pending Job Queue -->
          <div class="glass-card" style="flex-grow: 1;">
            <div class="glass-card-header">
              <h3 class="glass-card-title">
                <i class="fa-solid fa-hourglass-half"></i>
                <span>Order Dispatch Pool</span>
              </h3>
              <span class="nav-badge" style="position: static; background: var(--pepsi-blue);">${pendingOrders.length} Available</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 16px;">
              ${pendingOrders.length === 0 ? `
                <div style="text-align: center; padding: 30px 10px; color: var(--pepsi-text-secondary); font-size: 13px;">
                  <i class="fa-solid fa-circle-check" style="font-size: 32px; color: rgba(255,255,255,0.02); margin-bottom: 10px; display: block;"></i>
                  <span>All Pepsi orders are currently dispatched. Good job!</span>
                </div>
              ` : pendingOrders.map(order => this.getPendingJobCardHtml(order)).join('')}
            </div>
          </div>

        </div>

        <!-- Right Column: Interactive Route Optimizer -->
        <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="glass-card-header">
              <h3 class="glass-card-title">
                <i class="fa-solid fa-circle-nodes" style="color: var(--neon-green);"></i>
                <span>Route Optimization Engine</span>
              </h3>
            </div>
            
            <p style="color: var(--pepsi-text-secondary); font-size: 12px; margin-bottom: 20px;">
              Visualize Dijkstra pathfinding algorithm mapping the most eco-friendly street route from Pepsi Hub to destination.
            </p>

            <canvas id="route-opt-map" class="route-opt-canvas"></canvas>
          </div>

          <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--pepsi-text-secondary); background: rgba(0,0,0,0.1); padding: 10px 16px; border-radius: var(--border-radius-sm);">
              <span>Engine Status:</span>
              <strong id="opt-engine-status" style="color: white; text-transform: uppercase; font-family: var(--font-tech);">
                ${this.isOptimizing ? 'Running Pathing Algorithm' : this.optimizedPath.length > 0 ? 'Optimal Route Mapped' : 'Idle'}
              </strong>
            </div>

            <button class="btn-primary" id="btn-run-optimization" style="width: 100%; font-family: var(--font-tech);" 
              ${(!this.activeRiderOrder || this.activeRiderOrder.status !== 'preparing' || this.isOptimizing) ? 'disabled' : ''}>
              <i class="fa-solid fa-calculator"></i>
              <span>Compute Optimal Route</span>
            </button>
          </div>
        </div>

      </div>
    `;

    this.setupEvents();
    this.initGrid();
    this.drawGrid();
  },

  getActiveJobHtml(order) {
    if (!order) {
      return `
        <div style="text-align: center; padding: 40px 20px; color: var(--pepsi-text-secondary); font-size: 13px;">
          <i class="fa-solid fa-motorcycle" style="font-size: 40px; color: rgba(255,255,255,0.02); margin-bottom: 12px; display: block;"></i>
          <span>No active delivery duty. Accept a job from the Dispatch Pool below to begin!</span>
        </div>
      `;
    }

    const itemsText = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

    return `
      <div class="rider-order-card">
        <div class="rider-order-meta">
          <div>
            <div style="font-family: var(--font-tech); font-weight: 800; color: white;">Order ID: ${order.id}</div>
            <div style="font-size: 11px; color: var(--pepsi-text-secondary); margin-top: 2px;">Address: ${order.address}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-tech); font-weight: 800; color: var(--neon-blue);">$${order.total.toFixed(2)}</div>
            <div style="font-size: 10px; color: var(--pepsi-text-secondary); text-transform: uppercase; font-weight: bold; margin-top: 2px;">
              Status: ${order.status}
            </div>
          </div>
        </div>

        <div style="font-size: 12px; color: var(--pepsi-text-secondary);">
          <strong>Items:</strong> ${itemsText}
        </div>

        <div class="rider-actions">
          ${order.status === 'accepted' ? `
            <button class="btn-rider-action btn-pickup" id="btn-rider-pickup">
              <i class="fa-solid fa-box-open" style="margin-right: 6px;"></i>
              <span>Confirm Packing &amp; Start</span>
            </button>
          ` : ''}
          
          ${order.status === 'preparing' ? `
            <div style="font-size: 12px; color: var(--neon-blue); text-align: center; width: 100%; font-weight: bold;">
              <i class="fa-solid fa-gears fa-spin" style="margin-right: 6px;"></i>
              <span>Ready for route calculation in optimization panel.</span>
            </div>
          ` : ''}

          ${order.status === 'out_for_delivery' ? `
            <div style="width: 100%; display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--pepsi-text-secondary);">
                <span>Delivery progress:</span>
                <span style="font-family: var(--font-tech); color: var(--neon-blue);">${Math.round(order.deliveryProgress)}%</span>
              </div>
              <div style="height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
                <div style="height: 100%; width: ${order.deliveryProgress}%; background: linear-gradient(90deg, var(--pepsi-blue), var(--neon-blue)); border-radius: 10px; transition: width 0.5s ease;"></div>
              </div>
              <button class="btn-rider-action btn-complete" id="btn-rider-complete" ${order.deliveryProgress < 100 ? 'disabled' : ''}>
                <i class="fa-solid fa-circle-check" style="margin-right: 6px;"></i>
                <span>Complete Delivery</span>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  getPendingJobCardHtml(order) {
    const itemSummary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    return `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--pepsi-glass-border); border-radius: var(--border-radius-md); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="max-width: 70%;">
          <div style="font-family: var(--font-tech); font-weight: 800; font-size: 14px; color: white;">Order #${order.id}</div>
          <div style="font-size: 12px; color: var(--pepsi-text-secondary); margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <strong>Items:</strong> ${itemSummary}
          </div>
          <div style="font-size: 11px; color: var(--pepsi-text-secondary); margin-top: 2px;">
            <strong>To:</strong> ${order.address}
          </div>
        </div>
        <button class="btn-rider-action btn-accept" data-id="${order.id}" style="width: auto; padding: 8px 16px; font-size: 12px;">
          Accept Job
        </button>
      </div>
    `;
  },

  setupEvents() {
    // Accept order click handler
    this.container.querySelectorAll('.btn-accept').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-id');
        Store.state.activeRiderOrder = orderId;
        const order = Store.state.orders.find(o => o.id === orderId);
        if (order) {
          order.rider = 'Courier You';
          Store.updateOrderStatus(orderId, 'accepted');
          showToast('Job Accepted', `Order ${orderId} is assigned to you. Go to packing.`, 'success');
          this.render(Store.state);
        }
      });
    });

    // Packing click handler
    const pickupBtn = document.getElementById('btn-rider-pickup');
    if (pickupBtn) {
      pickupBtn.addEventListener('click', () => {
        if (this.activeRiderOrder) {
          Store.updateOrderStatus(this.activeRiderOrder.id, 'preparing');
          showToast('Order Preparing', `Packing items. Calculate optimal route to dispatch.`, 'info');
          this.render(Store.state);
        }
      });
    }

    // Route Optimization trigger
    const optBtn = document.getElementById('btn-run-optimization');
    if (optBtn) {
      optBtn.addEventListener('click', () => {
        this.runDijkstraAnimation();
      });
    }

    // Complete order click handler
    const completeBtn = document.getElementById('btn-rider-complete');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        if (this.activeRiderOrder) {
          Store.updateOrderStatus(this.activeRiderOrder.id, 'delivered');
          Store.state.activeRiderOrder = null;
          Store.save();
          showToast('Delivery Completed!', `Payment registered. Carbon saved credit added!`, 'success');
          this.activeRiderOrder = null;
          this.optimizedPath = [];
          this.exploredNodes = [];
          this.render(Store.state);
        }
      });
    }
  },

  // --- ROUTE MAP / DIJKSTRA GRAPH INITIALIZER ---
  initGrid() {
    this.canvas = document.getElementById('route-opt-map');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 500;
    this.canvas.height = 380;

    // Create a 5x4 grid of nodes representing intersections
    this.gridNodes = [];
    const rows = 4;
    const cols = 5;
    const paddingX = 60;
    const paddingY = 50;
    const spacingX = (this.canvas.width - paddingX * 2) / (cols - 1);
    const spacingY = (this.canvas.height - paddingY * 2) / (rows - 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = r * cols + c;
        this.gridNodes.push({
          id,
          x: paddingX + c * spacingX,
          y: paddingY + r * spacingY,
          r,
          c,
          label: id === 0 ? 'Pepsi Hub' : id === (rows*cols - 1) ? 'Customer' : `Node-${id}`
        });
      }
    }

    // Connect nodes into grid links
    this.gridLinks = [];
    for (let i = 0; i < this.gridNodes.length; i++) {
      const node = this.gridNodes[i];
      // Connect right
      if (node.c < cols - 1) {
        this.gridLinks.push({ n1: node.id, n2: node.id + 1 });
      }
      // Connect down
      if (node.r < rows - 1) {
        this.gridLinks.push({ n1: node.id, n2: node.id + cols });
      }
    }
  },

  drawGrid() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background grids
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); ctx.stroke();
    }

    // Draw grid roads
    ctx.strokeStyle = '#0e172f';
    ctx.lineWidth = 6;
    this.gridLinks.forEach(link => {
      const node1 = this.gridNodes.find(n => n.id === link.n1);
      const node2 = this.gridNodes.find(n => n.id === link.n2);
      ctx.beginPath();
      ctx.moveTo(node1.x, node1.y);
      ctx.lineTo(node2.x, node2.y);
      ctx.stroke();
    });

    // Draw explored links during Dijkstra search
    if (this.exploredNodes.length > 0) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 6;
      this.gridLinks.forEach(link => {
        const has1 = this.exploredNodes.includes(link.n1);
        const has2 = this.exploredNodes.includes(link.n2);
        if (has1 && has2 && Math.abs(link.n1 - link.n2) <= 5) {
          const node1 = this.gridNodes.find(n => n.id === link.n1);
          const node2 = this.gridNodes.find(n => n.id === link.n2);
          ctx.beginPath();
          ctx.moveTo(node1.x, node1.y);
          ctx.lineTo(node2.x, node2.y);
          ctx.stroke();
        }
      });
    }

    // Draw final optimized path links
    if (this.optimizedPath.length > 0) {
      ctx.strokeStyle = 'var(--neon-blue)';
      ctx.lineWidth = 6;
      ctx.shadowColor = 'var(--neon-blue)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      const first = this.gridNodes.find(n => n.id === this.optimizedPath[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < this.optimizedPath.length; i++) {
        const next = this.gridNodes.find(n => n.id === this.optimizedPath[i]);
        ctx.lineTo(next.x, next.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    // Draw nodes
    this.gridNodes.forEach(node => {
      const isStart = node.id === 0;
      const isEnd = node.id === this.gridNodes.length - 1;
      
      let color = 'rgba(255,255,255,0.06)';
      let border = 'rgba(255,255,255,0.2)';
      let shadow = '';

      if (isStart) {
        color = 'var(--pepsi-blue)'; border = 'var(--neon-blue)'; shadow = 'var(--neon-blue)';
      } else if (isEnd) {
        color = 'var(--pepsi-red)'; border = 'var(--neon-red)'; shadow = 'var(--neon-red)';
      } else if (this.optimizedPath.includes(node.id)) {
        color = 'rgba(0, 240, 255, 0.4)'; border = 'var(--neon-blue)'; shadow = 'var(--neon-blue)';
      } else if (this.exploredNodes.includes(node.id)) {
        color = 'rgba(245, 158, 11, 0.3)'; border = 'var(--color-warning)'; shadow = 'var(--color-warning)';
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      
      if (shadow) {
        ctx.shadowColor = shadow;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Node labels
      if (isStart || isEnd) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(node.label.toUpperCase(), node.x, node.y - 14);
      }
    });
  },

  runDijkstraAnimation() {
    if (this.isOptimizing || !this.activeRiderOrder) return;
    this.isOptimizing = true;
    this.optimizedPath = [];
    this.exploredNodes = [];
    
    const engineStatus = document.getElementById('opt-engine-status');
    const optBtn = document.getElementById('btn-run-optimization');
    if (engineStatus) engineStatus.textContent = 'Mapping intersections...';
    if (optBtn) optBtn.disabled = true;

    // Simulated path searching: list nodes to explore in order
    // Dijkstra wave propagating from start (0) to end (19)
    const explorationSequence = [
      [0],
      [1, 5],
      [2, 6, 10],
      [3, 7, 11, 15],
      [4, 8, 12, 16],
      [9, 13, 17],
      [14, 18],
      [19]
    ];

    let step = 0;
    const searchTimer = setInterval(() => {
      if (step < explorationSequence.length) {
        this.exploredNodes.push(...explorationSequence[step]);
        this.drawGrid();
        
        // Synth a short synth click sound for pathing search
        this.playBeepTone(400 + step * 80, 0.05);

        step++;
      } else {
        clearInterval(searchTimer);
        
        // Finalize path calculation
        // Top-left to bottom-right shortest Manhattan path: 0 -> 1 -> 2 -> 7 -> 12 -> 13 -> 14 -> 19 (for variety)
        this.optimizedPath = [0, 5, 10, 11, 12, 17, 18, 19];
        this.drawGrid();
        
        // Play success tone
        this.playSuccessTone();

        this.isOptimizing = false;
        
        if (engineStatus) engineStatus.textContent = 'Optimal Route Calculated!';
        
        showToast('Route Mapped!', 'Optimized paths loaded. Transit scooter is dispatched!', 'success');

        // Update Order in store to "out_for_delivery"
        Store.updateOrderStatus(this.activeRiderOrder.id, 'out_for_delivery');
        this.render(Store.state);

        // Start rider-side travel simulator
        this.startRiderDeliveryTravel(this.activeRiderOrder);
      }
    }, 450);
  },

  startRiderDeliveryTravel(order) {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    
    this.simulationInterval = setInterval(() => {
      const curOrder = Store.state.orders.find(o => o.id === order.id);
      if (!curOrder || curOrder.status !== 'out_for_delivery') {
        clearInterval(this.simulationInterval);
        return;
      }

      // Progress travel by 4% per second in rider console (faster than standard customer mode for testing!)
      const nextProg = Math.min(100, curOrder.deliveryProgress + 4);
      Store.updateOrderProgress(curOrder.id, nextProg);

      // Re-render to show progress bar and enable complete button
      this.render(Store.state);

      if (nextProg >= 100) {
        clearInterval(this.simulationInterval);
        showToast('Arrived at Destination', 'Deliver the Pepsi pack and get coupon rewards!', 'success');
      }
    }, 1000);
  },

  playBeepTone(freq, duration) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  },

  playSuccessTone() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const playTone = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };
      playTone(523.25, now, 0.1); // C5
      playTone(659.25, now + 0.1, 0.1); // E5
      playTone(783.99, now + 0.2, 0.15); // G5
      playTone(1046.50, now + 0.35, 0.35); // C6
    } catch (e) {}
  },

  destroy() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);
  }
};
