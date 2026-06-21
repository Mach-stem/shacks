import { Store } from './store.js';
import { showToast } from './app.js';

export const RecyclingView = {
  container: null,
  isScanning: false,

  init(container) {
    this.container = container;
  },

  render(state) {
    if (!this.container) return;

    const userStats = state.userStats;

    this.container.innerHTML = `
      <div class="recycling-grid">
        
        <!-- Left: Interactive Scanner Simulator -->
        <div class="glass-card scanner-view">
          <div class="glass-card-header" style="width: 100%;">
            <h3 class="glass-card-title">
              <i class="fa-solid fa-qrcode"></i>
              <span>Smart Can Depository</span>
            </h3>
          </div>
          
          <p style="color: var(--pepsi-text-secondary); font-size: 13px; text-align: center; margin-bottom: 20px; max-width: 320px;">
            Simulate dropping off a Pepsi can. Position the can barcode/QR code in the scanner viewport to process your eco rewards.
          </p>

          <!-- Scanner Frame -->
          <div class="scanner-frame" id="qr-scanner-frame">
            <span class="scanner-corner corner-tl"></span>
            <span class="scanner-corner corner-tr"></span>
            <span class="scanner-corner corner-bl"></span>
            <span class="scanner-corner corner-br"></span>
            
            <!-- Custom QR Vector Icon with Pepsi Globe in center -->
            <svg viewBox="0 0 100 100" class="qr-code-svg" id="scanner-qr-svg">
              <!-- Corner Anchor Blocks -->
              <rect x="10" y="10" width="24" height="24" fill="none" stroke="var(--neon-blue)" stroke-width="4"/>
              <rect x="16" y="16" width="12" height="12" fill="var(--neon-blue)"/>
              
              <rect x="66" y="10" width="24" height="24" fill="none" stroke="var(--neon-blue)" stroke-width="4"/>
              <rect x="72" y="16" width="12" height="12" fill="var(--neon-blue)"/>
              
              <rect x="10" y="66" width="24" height="24" fill="none" stroke="var(--neon-blue)" stroke-width="4"/>
              <rect x="16" y="72" width="12" height="12" fill="var(--neon-blue)"/>
              
              <!-- Random QR Pixels -->
              <rect x="42" y="10" width="6" height="12" fill="rgba(0, 240, 255, 0.4)"/>
              <rect x="52" y="16" width="6" height="6" fill="rgba(0, 240, 255, 0.4)"/>
              <rect x="42" y="28" width="12" height="6" fill="rgba(0, 240, 255, 0.4)"/>
              <rect x="10" y="42" width="12" height="6" fill="rgba(0, 240, 255, 0.4)"/>
              <rect x="28" y="42" width="6" height="12" fill="rgba(0, 240, 255, 0.4)"/>
              
              <rect x="78" y="42" width="12" height="12" fill="rgba(0, 240, 255, 0.4)"/>
              <rect x="66" y="48" width="6" height="6" fill="rgba(0, 240, 255, 0.4)"/>
              <rect x="42" y="66" width="12" height="6" fill="rgba(0, 240, 255, 0.4)"/>
              <rect x="52" y="78" width="12" height="12" fill="rgba(0, 240, 255, 0.4)"/>
              <rect x="72" y="66" width="6" height="18" fill="rgba(0, 240, 255, 0.4)"/>

              <!-- Central Pepsi Globe Emblem overlay -->
              <circle cx="50" cy="50" r="14" fill="#fff"/>
              <path d="M 50,36 A 14,14 0 0,1 63.5,47 Q 56,44 50,49 Q 44,54 36.5,47 A 14,14 0 0,1 50,36" fill="#E31B23" />
              <path d="M 50,64 A 14,14 0 0,1 36.5,53 Q 44,56 50,51 Q 56,46 63.5,53 A 14,14 0 0,1 50,64" fill="#0056B3" />
            </svg>
          </div>

          <button class="btn-primary btn-scan" id="btn-simulate-scan" ${this.isScanning ? 'disabled' : ''}>
            <i class="fa-solid ${this.isScanning ? 'fa-spinner fa-spin' : 'fa-barcode'}"></i>
            <span>${this.isScanning ? 'Scanning...' : 'Simulate QR Scan'}</span>
          </button>
        </div>

        <!-- Right: Leaderboard & Stats -->
        <div style="display: flex; flex-direction: column; gap: 30px;">
          
          <!-- Leaderboard -->
          <div class="glass-card">
            <div class="glass-card-header">
              <h3 class="glass-card-title">
                <i class="fa-solid fa-trophy" style="color: var(--neon-yellow);"></i>
                <span>Top Pepsi Recyclers</span>
              </h3>
            </div>
            
            <div class="leaderboard-list">
              ${state.leaderboard.map(user => this.getLeaderboardRowHtml(user)).join('')}
            </div>
          </div>

        </div>

        <!-- Full-Width Bottom: Rewards Voucher Shop -->
        <div class="glass-card" style="grid-column: span 2;">
          <div class="glass-card-header">
            <h3 class="glass-card-title">
              <i class="fa-solid fa-ticket-simple" style="color: var(--neon-red);"></i>
              <span>Redeem Points Voucher Shop</span>
            </h3>
            <div style="font-family: var(--font-tech); font-size: 14px; color: var(--neon-blue);">
              Active Points: <strong style="font-size: 16px;">${userStats.points}</strong>
            </div>
          </div>

          <p style="color: var(--pepsi-text-secondary); font-size: 13px; margin-bottom: 20px;">
            Trade your accumulated Eco Points for Pepsi discount vouchers, free delivery credits, or product upgrades.
          </p>

          <div class="rewards-shop-grid">
            ${state.coupons.map(coupon => this.getCouponCardHtml(coupon, userStats.points)).join('')}
          </div>
        </div>

      </div>
    `;

    this.setupEvents();
  },

  getLeaderboardRowHtml(user) {
    let rankClass = 'rank-other';
    if (user.rank === 1) rankClass = 'rank-1';
    if (user.rank === 2) rankClass = 'rank-2';
    if (user.rank === 3) rankClass = 'rank-3';

    return `
      <div class="leaderboard-row ${user.isUser ? 'user-row' : ''}">
        <span class="rank-badge ${rankClass}">${user.rank}</span>
        <span class="leaderboard-name">
          ${user.name} 
          ${user.isUser ? '<strong style="color: var(--neon-blue); font-size: 10px; margin-left: 6px; text-transform: uppercase;">You</strong>' : ''}
        </span>
        <div class="leaderboard-stats">
          <span class="stat-can-count"><i class="fa-solid fa-trash-can"></i> ${user.cans} cans</span>
          <span class="stat-co2-saved"><i class="fa-solid fa-leaf"></i> ${user.co2.toFixed(1)}kg CO₂</span>
        </div>
      </div>
    `;
  },

  getCouponCardHtml(coupon, userPoints) {
    const isAffordable = userPoints >= coupon.pointsCost;
    const buttonText = coupon.redeemed 
      ? (coupon.id === 'c3' ? 'Added to Account' : 'Voucher Unlocked') 
      : `Redeem for ${coupon.pointsCost} pts`;
      
    const disabledState = (!isAffordable || coupon.redeemed) ? 'disabled' : '';

    return `
      <div class="coupon-card ${coupon.redeemed ? 'redeemed' : ''}">
        <div>
          <div class="coupon-title">${coupon.title}</div>
          <p style="font-size: 11px; color: var(--pepsi-text-secondary); margin-top: 4px;">
            ${coupon.description}
          </p>
          ${coupon.redeemed ? `
            <div style="font-family: var(--font-tech); font-size: 11px; color: var(--neon-green); margin-top: 6px; font-weight: bold;">
              PROMO CODE: ${coupon.code}
            </div>
          ` : `
            <span class="coupon-cost"><i class="fa-solid fa-award"></i> ${coupon.pointsCost} Eco Points</span>
          `}
        </div>
        <button class="btn-redeem" data-id="${coupon.id}" ${disabledState}>
          ${coupon.redeemed ? '<i class="fa-solid fa-circle-check" style="margin-right: 4px;"></i>' : ''}
          <span>${buttonText}</span>
        </button>
      </div>
    `;
  },

  setupEvents() {
    const scanBtn = document.getElementById('btn-simulate-scan');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        this.runScanSimulation();
      });
    }

    this.container.querySelectorAll('.btn-redeem').forEach(btn => {
      btn.addEventListener('click', () => {
        const couponId = btn.getAttribute('data-id');
        const coupon = Store.state.coupons.find(c => c.id === couponId);
        if (coupon) {
          const success = Store.redeemCoupon(couponId);
          if (success) {
            // Synthesize redemption coin sound
            this.playCoinSound();

            showToast('Redemption Successful', `Unlocked voucher: "${coupon.title}"`, 'success');
            this.render(Store.state);
          }
        }
      });
    });
  },

  runScanSimulation() {
    if (this.isScanning) return;
    this.isScanning = true;
    this.render(Store.state);

    const scannerFrame = document.getElementById('qr-scanner-frame');
    if (scannerFrame) {
      scannerFrame.classList.add('scanning');
    }

    // After 1.5s, complete scan
    setTimeout(() => {
      this.isScanning = false;

      // Select random pepsi can type to recycle
      const canTypes = ['Pepsi Zero Sugar', 'Pepsi Classic', 'Pepsi Nitro Draft', 'Pepsi Mango Zero', 'Diet Pepsi'];
      const recycledCan = canTypes[Math.floor(Math.random() * canTypes.length)];

      const result = Store.recycleCan(recycledCan);

      // Play synthesized scan beep
      this.playBeepSound();

      // Scanner flash animation
      if (scannerFrame) {
        scannerFrame.classList.remove('scanning');
        scannerFrame.style.boxShadow = '0 0 30px rgba(57, 255, 20, 0.6)';
        scannerFrame.style.borderColor = 'var(--neon-green)';
        setTimeout(() => {
          scannerFrame.style.boxShadow = '';
          scannerFrame.style.borderColor = '';
        }, 600);
      }

      showToast('Can Deposited!', `1x ${recycledCan} recycled! +${result.pointsEarned} Points.`, 'success');
      this.render(Store.state);
    }, 1500);
  },

  // --- AUDIO SYNTHESIZERS USING WEB AUDIO API ---
  playBeepSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Retro scan ding
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio Context is blocked or unsupported', e);
    }
  },

  playCoinSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Retro coin sound: 2 sequential pitch bursts (e.g. Mario coin)
      const now = ctx.currentTime;
      
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playTone(987.77, now, 0.08); // B5 tone
      playTone(1318.51, now + 0.08, 0.25); // E6 tone
    } catch (e) {
      console.warn('Audio Context is blocked or unsupported', e);
    }
  }
};
