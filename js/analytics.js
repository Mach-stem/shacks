import { Store } from './store.js';

export const AnalyticsView = {
  container: null,
  charts: {},

  init(container) {
    this.container = container;
  },

  render(state) {
    if (!this.container) return;

    this.destroyCharts();

    const stats = state.userStats;
    const completedDeliveries = state.orders.filter(o => o.status === 'delivered').length;

    this.container.innerHTML = `
      <!-- Top Row Summary Cards -->
      <div class="analytics-summary-cards">
        
        <div class="glass-card stat-widget" style="padding: 20px;">
          <div class="widget-icon icon-blue" style="width: 44px; height: 44px; font-size: 18px;">
            <i class="fa-solid fa-trash-can"></i>
          </div>
          <div class="widget-details">
            <span class="widget-val" style="font-size: 20px;">${stats.recycledCount}</span>
            <span class="widget-lbl" style="font-size: 10px;">Total Cans</span>
          </div>
        </div>

        <div class="glass-card stat-widget" style="padding: 20px;">
          <div class="widget-icon icon-green" style="width: 44px; height: 44px; font-size: 18px;">
            <i class="fa-solid fa-cloud-arrow-down"></i>
          </div>
          <div class="widget-details">
            <span class="widget-val" style="font-size: 20px;">${stats.carbonSaved.toFixed(2)} kg</span>
            <span class="widget-lbl" style="font-size: 10px;">CO₂ Prevented</span>
          </div>
        </div>

        <div class="glass-card stat-widget" style="padding: 20px;">
          <div class="widget-icon icon-red" style="width: 44px; height: 44px; font-size: 18px;">
            <i class="fa-solid fa-bicycle"></i>
          </div>
          <div class="widget-details">
            <span class="widget-val" style="font-size: 20px;">${completedDeliveries}</span>
            <span class="widget-lbl" style="font-size: 10px;">E-Deliveries</span>
          </div>
        </div>

        <div class="glass-card stat-widget" style="padding: 20px;">
          <div class="widget-icon icon-green" style="width: 44px; height: 44px; font-size: 18px;">
            <i class="fa-solid fa-star"></i>
          </div>
          <div class="widget-details">
            <span class="widget-val" style="font-size: 20px;">${stats.points}</span>
            <span class="widget-lbl" style="font-size: 10px;">Current Points</span>
          </div>
        </div>

      </div>

      <!-- Charts Grid -->
      <div class="grid-2" style="margin-bottom: 30px;">
        
        <!-- Line Chart: CO2 Offset Trend -->
        <div class="glass-card">
          <div class="glass-card-header">
            <h3 class="glass-card-title" style="font-size: 14px;">
              <i class="fa-solid fa-chart-line"></i>
              <span>Carbon Offset Progression</span>
            </h3>
          </div>
          <div class="chart-container">
            <canvas id="chart-co2-trend"></canvas>
          </div>
        </div>

        <!-- Doughnut Chart: Recycled Drink Types -->
        <div class="glass-card">
          <div class="glass-card-header">
            <h3 class="glass-card-title" style="font-size: 14px;">
              <i class="fa-solid fa-chart-pie"></i>
              <span>Recycled Pepsi Varieties</span>
            </h3>
          </div>
          <div class="chart-container">
            <canvas id="chart-variety-distribution"></canvas>
          </div>
        </div>

      </div>

      <!-- Full-Width Bottom Bar Chart: Weekly Activity -->
      <div class="glass-card">
        <div class="glass-card-header">
          <h3 class="glass-card-title" style="font-size: 14px;">
            <i class="fa-solid fa-calendar-days"></i>
            <span>Weekly Recycling Volume</span>
          </h3>
        </div>
        <div class="chart-container" style="height: 220px;">
          <canvas id="chart-weekly-activity"></canvas>
        </div>
      </div>
    `;

    // Wait a brief tick for elements to be fully added to the DOM, then initialize charts
    setTimeout(() => {
      this.initCharts(stats);
    }, 50);
  },

  initCharts(stats) {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.error('Chart.js is not loaded');
      return;
    }

    // Chart.js Global styling modifications for dark mode
    Chart.defaults.color = '#8E9BAE';
    Chart.defaults.font.family = 'Outfit';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.04)';

    // 1. Carbon Offset Trend Chart
    const ctxTrend = document.getElementById('chart-co2-trend');
    if (ctxTrend) {
      // Mock progression data leading up to active carbon offset
      const baseCO2 = 1.25; // past history
      const totalCO2 = baseCO2 + stats.carbonSaved;

      this.charts.trend = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun (Today)'],
          datasets: [{
            label: 'CO₂ Saved (kg)',
            data: [0.15, 0.40, 0.72, 1.05, 1.25, parseFloat(totalCO2.toFixed(3))],
            borderColor: '#00F0FF',
            backgroundColor: 'rgba(0, 240, 255, 0.05)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#00F0FF',
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { grid: { color: 'rgba(255,255,255,0.03)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // 2. Pepsi Varieties Distribution Chart
    const ctxDistribution = document.getElementById('chart-variety-distribution');
    if (ctxDistribution) {
      // Calculate dynamic data based on recycled count
      // Distribute user's count across categories
      const count = stats.recycledCount;
      const data = count > 0 
        ? [Math.ceil(count * 0.35), Math.floor(count * 0.25), Math.floor(count * 0.2), Math.floor(count * 0.1), Math.ceil(count * 0.1)]
        : [12, 8, 6, 4, 3]; // mock defaults if zero

      this.charts.distribution = new Chart(ctxDistribution, {
        type: 'doughnut',
        data: {
          labels: ['Zero Sugar', 'Classic', 'Diet', 'Mango Zero', 'Nitro Draft'],
          datasets: [{
            data: data,
            backgroundColor: [
              '#1a1a1a', // Zero Sugar
              '#004B87', // Classic
              '#a0a0a0', // Diet
              '#ff8c00', // Mango
              '#d4af37'  // Nitro
            ],
            borderColor: 'rgba(13, 18, 36, 0.9)',
            borderWidth: 2,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 12,
                font: { size: 11 }
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // 3. Weekly Recycling Activity Chart
    const ctxWeekly = document.getElementById('chart-weekly-activity');
    if (ctxWeekly) {
      // Mock days activity + current day includes recycled counts
      const currentDayRecycled = Math.min(5, Math.ceil(stats.recycledCount % 6));
      
      this.charts.weekly = new Chart(ctxWeekly, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Cans Deposited',
            data: [2, 5, 1, 3, 0, 4, currentDayRecycled],
            backgroundColor: 'rgba(0, 75, 135, 0.65)',
            borderColor: 'var(--neon-blue)',
            borderWidth: 1.5,
            borderRadius: 5,
            hoverBackgroundColor: 'var(--neon-blue)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { 
              grid: { color: 'rgba(255,255,255,0.03)' },
              ticks: { precision: 0 }
            },
            x: { grid: { display: false } }
          }
        }
      });
    }
  },

  destroyCharts() {
    // Destroy active charts to avoid overlays
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
        this.charts[key] = null;
      }
    });
    this.charts = {};
  },

  destroy() {
    this.destroyCharts();
  }
};
