import { Store } from './store.js';

export const HomeView = {
  container: null,

  init(container) {
    this.container = container;
  },

  render(state) {
    if (!this.container) return;

    const latestOrder = state.orders[0];
    const userStats = state.userStats;

    // Calculate Badge Tier
    let badgeName = 'Eco Novice';
    let badgeClass = 'icon-blue';
    let badgeIcon = 'fa-seedling';
    
    if (userStats.points >= 500) {
      badgeName = 'Pepsi Green Guard';
      badgeClass = 'icon-red';
      badgeIcon = 'fa-tree';
    } else if (userStats.points >= 200) {
      badgeName = 'Carbon Warrior';
      badgeClass = 'icon-green';
      badgeIcon = 'fa-mountain';
    } else if (userStats.points >= 50) {
      badgeName = 'Eco Pioneer';
      badgeClass = 'icon-blue';
      badgeIcon = 'fa-leaf';
    }

    this.container.innerHTML = `
      <div class="grid-3" style="grid-template-rows: auto auto;">
        
        <!-- Hero Section -->
        <div class="glass-card home-hero">
          <div class="hero-text">
            <span class="hero-tag"><i class="fa-solid fa-bolt"></i> Pepsi Smart System</span>
            <h2>Pepsi Delivery &amp; Smart Recycling</h2>
            <p>Order your favorite Pepsi drinks via zero-emission scooters. Recycle your cans instantly using our simulated QR rewards system to earn carbon credits, discounts, and free products!</p>
            <div class="hero-ctas">
              <a href="#catalog" class="btn-primary">
                <i class="fa-solid fa-shopping-cart"></i>
                <span>Order Pepsi</span>
              </a>
              <a href="#recycling" class="btn-secondary">
                <i class="fa-solid fa-recycle"></i>
                <span>Recycle &amp; Earn</span>
              </a>
            </div>
          </div>
          <div class="hero-graphic">
            <div class="floating-can">
              <div class="can-reflection"></div>
              <div class="can-logo"></div>
              <span class="can-text">PEPSI</span>
            </div>
          </div>
        </div>

        <!-- 3 Stat Cards -->
        <div class="glass-card stat-widget">
          <div class="widget-icon icon-blue">
            <i class="fa-solid fa-recycle"></i>
          </div>
          <div class="widget-details">
            <span class="widget-val" id="home-stat-cans">${userStats.recycledCount}</span>
            <span class="widget-lbl">Cans Recycled</span>
          </div>
        </div>

        <div class="glass-card stat-widget">
          <div class="widget-icon icon-green">
            <i class="fa-solid fa-leaf"></i>
          </div>
          <div class="widget-details">
            <span class="widget-val" id="home-stat-co2">${userStats.carbonSaved.toFixed(3)}</span>
            <span class="widget-lbl">kg CO₂ Saved</span>
          </div>
        </div>

        <div class="glass-card stat-widget">
          <div class="widget-icon icon-red">
            <i class="fa-solid fa-award"></i>
          </div>
          <div class="widget-details">
            <span class="widget-val" id="home-stat-points">${userStats.points}</span>
            <span class="widget-lbl">Eco Points</span>
          </div>
        </div>

        <!-- Lower Section Grid (2-columns) -->
        <div class="glass-card" style="grid-column: span 2;">
          <div class="glass-card-header">
            <h3 class="glass-card-title">
              <i class="fa-solid fa-receipt"></i>
              <span>Latest Delivery Order</span>
            </h3>
            ${latestOrder ? `<a href="#tracking" class="btn-secondary" style="padding: 6px 14px; font-size: 12px;">Track live</a>` : ''}
          </div>
          
          <div id="home-latest-order-container">
            ${this.getLatestOrderHtml(latestOrder)}
          </div>
        </div>

        <!-- Eco Achievement Level -->
        <div class="glass-card">
          <div class="glass-card-header">
            <h3 class="glass-card-title">
              <i class="fa-solid fa-medal"></i>
              <span>Eco Status</span>
            </h3>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; padding: 10px 0;">
            <div class="widget-icon ${badgeClass}" style="width: 80px; height: 80px; border-radius: 50%; font-size: 36px; box-shadow: 0 0 20px rgba(255,255,255,0.05);">
              <i class="fa-solid ${badgeIcon}"></i>
            </div>
            <div>
              <h4 style="font-family: var(--font-tech); font-size: 18px; color: white;">${badgeName}</h4>
              <p style="color: var(--pepsi-text-secondary); font-size: 13px; margin-top: 4px;">
                ${this.getEcoLevelDescription(userStats.points)}
              </p>
            </div>
            
            <!-- Progress to next tier -->
            <div style="width: 100%;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--pepsi-text-secondary); margin-bottom: 6px;">
                <span>Progress to next Rank</span>
                <span>${userStats.points} / ${this.getNextTierPoints(userStats.points)} pts</span>
              </div>
              <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
                <div style="height: 100%; width: ${this.getTierProgressPercent(userStats.points)}%; background: linear-gradient(90deg, var(--pepsi-blue), var(--neon-blue)); border-radius: 10px;"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    // Add visual counter numbers load animations
    this.animateCounter('home-stat-cans', 0, userStats.recycledCount, 800);
    this.animateCounterFloat('home-stat-co2', 0, userStats.carbonSaved, 800);
    this.animateCounter('home-stat-points', 0, userStats.points, 800);
  },

  getLatestOrderHtml(order) {
    if (!order) {
      return `
        <div style="text-align: center; padding: 40px 20px; color: var(--pepsi-text-secondary);">
          <i class="fa-solid fa-basket-shopping" style="font-size: 40px; color: rgba(255,255,255,0.02); margin-bottom: 12px; display: block;"></i>
          <span>No active delivery orders. Browse the catalog to order some Pepsi!</span>
        </div>
      `;
    }

    const itemNames = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    
    let statusClass = 'color-info';
    let statusIcon = 'fa-clock';
    if (order.status === 'delivered') {
      statusClass = 'color-success';
      statusIcon = 'fa-circle-check';
    } else if (order.status === 'out_for_delivery') {
      statusClass = 'color-warning';
      statusIcon = 'fa-motorcycle';
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid var(--pepsi-glass-border); padding: 16px; border-radius: var(--border-radius-md);">
          <div>
            <div style="font-family: var(--font-tech); font-weight: 800; font-size: 15px; color: white;">Order #${order.id}</div>
            <div style="font-size: 13px; color: var(--pepsi-text-secondary); margin-top: 4px; line-height: 1.4;">
              <strong>Items:</strong> ${itemNames}
            </div>
            <div style="font-size: 12px; color: var(--pepsi-text-secondary); margin-top: 2px;">
              <strong>Delivery to:</strong> ${order.address}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-tech); font-weight: 800; font-size: 16px; color: var(--neon-blue);">$${order.total.toFixed(2)}</div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; margin-top: 6px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;" class="${statusClass}">
              <i class="fa-solid ${statusIcon}"></i>
              <span>${order.status.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>
        
        <!-- Live Delivery Progress Bar if Active -->
        ${order.status !== 'delivered' ? `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--pepsi-text-secondary); margin-bottom: 6px;">
              <span>Rider Delivery Progress</span>
              <span style="font-family: var(--font-tech); color: var(--neon-blue);">${Math.round(order.deliveryProgress)}%</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden;">
              <div style="height: 100%; width: ${order.deliveryProgress}%; background: linear-gradient(90deg, var(--pepsi-blue), var(--neon-blue)); border-radius: 10px; transition: width 0.5s ease;"></div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  getEcoLevelDescription(points) {
    if (points >= 500) return 'You are in the elite tier of recyclers! Planet Earth is proud.';
    if (points >= 200) return 'Incredible job! Your carbon savings make a huge real-world difference.';
    if (points >= 50) return 'Active contributor. Keep recycling Pepsi cans to level up.';
    return 'Start scanning QR codes on Pepsi cans to unlock rewards and raise your eco rank!';
  },

  getNextTierPoints(points) {
    if (points >= 500) return 1000;
    if (points >= 200) return 500;
    if (points >= 50) return 200;
    return 50;
  },

  getTierProgressPercent(points) {
    const current = points;
    let base = 0;
    let target = 50;

    if (points >= 500) {
      base = 500;
      target = 1000;
    } else if (points >= 200) {
      base = 200;
      target = 500;
    } else if (points >= 50) {
      base = 50;
      target = 200;
    }

    const percentage = ((current - base) / (target - base)) * 100;
    return Math.min(100, Math.max(0, percentage));
  },

  // Integer animated counter
  animateCounter(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    if (start === end) {
      obj.textContent = end;
      return;
    }
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const timer = setInterval(() => {
      current += increment;
      obj.textContent = current;
      if (current === end) {
        clearInterval(timer);
      }
    }, Math.max(stepTime, 10));
  },

  // Float animated counter
  animateCounterFloat(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    if (start === end) {
      obj.textContent = end.toFixed(3);
      return;
    }
    const stepCount = 50;
    const stepTime = duration / stepCount;
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const currentVal = start + ((end - start) * (currentStep / stepCount));
      obj.textContent = currentVal.toFixed(3);
      if (currentStep >= stepCount) {
        obj.textContent = end.toFixed(3);
        clearInterval(timer);
      }
    }, stepTime);
  }
};
