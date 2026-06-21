import { Store } from './store.js';
import { showToast } from './app.js';

export const CatalogView = {
  container: null,
  activeFilter: 'all',

  init(container) {
    this.container = container;
  },

  render(state) {
    if (!this.container) return;

    const products = Store.getProducts();
    const filteredProducts = products.filter(p => {
      if (this.activeFilter === 'all') return true;
      if (this.activeFilter === 'zero') return p.calories === 0;
      if (this.activeFilter === 'sugar') return p.calories > 0;
      return true;
    });

    this.container.innerHTML = `
      <div class="catalog-header-bar">
        <div>
          <h2 style="font-family: var(--font-tech); font-size: 20px; font-weight: 800;">Browse Refreshment</h2>
          <p style="color: var(--pepsi-text-secondary); font-size: 13px; margin-top: 4px;">Choose from our smart delivery range. Delivers by Pep-Scooter.</p>
        </div>
        
        <div class="catalog-filters">
          <button class="filter-chip ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">All Drinks</button>
          <button class="filter-chip ${this.activeFilter === 'zero' ? 'active' : ''}" data-filter="zero">Zero Sugar</button>
          <button class="filter-chip ${this.activeFilter === 'sugar' ? 'active' : ''}" data-filter="sugar">Classic Sweet</button>
        </div>
      </div>

      <div class="grid-4" id="catalog-products-grid">
        ${filteredProducts.map(prod => this.getProductCardHtml(prod)).join('')}
      </div>
    `;

    this.setupEvents();
  },

  getProductCardHtml(prod) {
    const isDiet = prod.id === 'pepsi-diet';
    return `
      <div class="product-card" id="card-${prod.id}">
        <div class="product-image-container">
          <!-- Custom Premium Vector SVG/CSS Can representation -->
          <div class="product-can-vector" style="background: ${prod.canBg}; border-color: ${prod.color}">
            <div class="can-reflection"></div>
            <div class="can-logo-sm"></div>
            <span class="can-text" style="font-size: 11px; margin-top: 6px; ${isDiet ? 'color: #333;' : ''}">PEPSI</span>
            ${prod.calories === 0 ? `
              <div style="font-size: 6px; font-family: var(--font-tech); font-weight: 900; background: black; color: var(--neon-blue); padding: 1px 4px; border-radius: 4px; position: absolute; bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                ZERO
              </div>
            ` : ''}
          </div>
        </div>

        <div class="product-info-panel">
          <div class="product-tag">${prod.tagline}</div>
          <h3 class="product-name">${prod.name}</h3>
          <p class="product-desc">${prod.description}</p>
          <div class="product-meta">
            <span class="product-price">$${prod.price.toFixed(2)}</span>
            <button class="btn-add-cart" data-id="${prod.id}" aria-label="Add ${prod.name} to Cart">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  setupEvents() {
    // Filter click handlers
    this.container.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilter = btn.getAttribute('data-filter');
        this.render(Store.state);
      });
    });

    // Add to Cart click handlers
    this.container.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.getAttribute('data-id');
        const prod = Store.getProductById(productId);
        
        // Update store
        Store.addToCart(productId);
        
        // Trigger visual effect on the cart icon in header
        const cartBtn = document.getElementById('btn-open-cart');
        if (cartBtn) {
          cartBtn.style.animation = 'none';
          // Trigger reflow
          void cartBtn.offsetWidth;
          cartBtn.style.animation = 'float 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 2';
        }

        // Show success Toast
        showToast('Added to Cart', `1x ${prod.name} has been added to your shopping cart.`, 'success');
      });
    });
  }
};
