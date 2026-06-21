import { Store } from './store.js';
import { HomeView } from './home.js';
import { CatalogView } from './catalog.js';
import { TrackerView } from './tracker.js';
import { RecyclingView } from './recycling.js';
import { RiderView } from './rider.js';
import { AnalyticsView } from './analytics.js';

// Route Mapping
const VIEWS = {
  home: HomeView,
  catalog: CatalogView,
  tracking: TrackerView,
  recycling: RecyclingView,
  rider: RiderView,
  analytics: AnalyticsView
};

let currentViewName = '';

export const App = {
  init() {
    // Initialize State Store
    Store.init();

    // Setup Sidebar Toggles
    this.setupSidebar();

    // Setup Cart Drawer Actions
    this.setupCart();

    // Setup Routing
    this.setupRouting();

    // Setup Global Store Event Listeners
    window.addEventListener('pepsi-store-update', (e) => {
      this.syncUI(e.detail);
    });

    // Initial UI Sync
    this.syncUI(Store.state);

    // Initial Toast greeting
    this.showToast('Welcome Back!', 'Pepsi Smart Delivery System is online.', 'info');
  },

  // --- SIDEBAR HANDLERS ---
  setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleDesktop = document.getElementById('toggle-sidebar-desktop');
    const toggleMobile = document.getElementById('toggle-sidebar-mobile');

    toggleDesktop.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const icon = toggleDesktop.querySelector('i');
      if (sidebar.classList.contains('collapsed')) {
        icon.className = 'fa-solid fa-chevron-right';
      } else {
        icon.className = 'fa-solid fa-chevron-left';
      }
    });

    toggleMobile.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
    });

    // Close mobile sidebar when clicking main content
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && !sidebar.contains(e.target) && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
      }
    });
  },

  // --- HASH ROUTING ---
  setupRouting() {
    const handleRoute = () => {
      let hash = window.location.hash.substring(1);
      if (!hash || !VIEWS[hash]) {
        hash = 'home';
      }

      this.switchView(hash);
    };

    window.addEventListener('hashchange', handleRoute);
    // Trigger initial route
    handleRoute();
  },

  switchView(viewName) {
    if (currentViewName === viewName) return;

    // Remove active state from current navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      }
    });

    // Switch view sections visibility
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.add('hidden');
      section.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      targetSection.classList.add('active');
    }

    // Update Header page title
    const formattedTitle = viewName === 'home' 
      ? 'Home Hub' 
      : viewName === 'tracking' 
        ? 'Track Delivery' 
        : viewName === 'recycling' 
          ? 'Recycling Rewards' 
          : viewName === 'rider' 
            ? 'Rider Console' 
            : viewName === 'analytics' 
              ? 'Eco Analytics' 
              : 'Pepsi Catalog';
              
    document.getElementById('page-title').textContent = formattedTitle;

    // Initialize View Module
    const viewModule = VIEWS[viewName];
    if (viewModule) {
      currentViewName = viewName;
      viewModule.init(targetSection);
      viewModule.render(Store.state);
    }
  },

  // --- CART DRAWER HANDLERS ---
  setupCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    const openCartBtn = document.getElementById('btn-open-cart');
    const closeCartBtn = document.getElementById('btn-close-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    const placeOrderBtn = document.getElementById('btn-submit-order');
    const couponSelect = document.getElementById('checkout-coupon');

    openCartBtn.addEventListener('click', () => {
      cartDrawer.classList.add('open');
      this.renderCart(Store.state);
    });

    const closeCart = () => cartDrawer.classList.remove('open');
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    // Coupon change recalculates prices
    couponSelect.addEventListener('change', () => {
      this.renderCart(Store.state);
    });

    // Place Order submission
    placeOrderBtn.addEventListener('click', () => {
      const address = document.getElementById('checkout-address').value.trim();
      if (!address) {
        this.showToast('Address Required', 'Please enter a delivery address.', 'warning');
        return;
      }

      const cart = Store.getCart();
      if (cart.length === 0) {
        this.showToast('Cart is Empty', 'Add Pepsi products to cart first.', 'warning');
        return;
      }

      // Calculate coupon discount if any
      let discount = 0;
      let couponCode = '';
      const selectedCouponId = couponSelect.value;
      if (selectedCouponId) {
        const coupon = Store.state.coupons.find(c => c.id === selectedCouponId);
        if (coupon) {
          couponCode = coupon.code;
          if (selectedCouponId === 'c1') {
            discount = 1.00;
          } else if (selectedCouponId === 'c2') {
            // Free Nitro upgrade logic
            // Check if Nitro is in cart
            const nitroItem = cart.find(i => i.productId === 'pepsi-nitro');
            if (nitroItem) {
              discount = 1.00; // Upgrade savings (Nitro is $2.99, Classic is $1.99, save $1.00)
            } else {
              this.showToast('Nitro Required', 'Add Pepsi Nitro to cart to apply upgrade discount.', 'warning');
              return;
            }
          } else if (selectedCouponId === 'c4') {
            // 50% Off 4-Pack (check if we have at least 4 cans total in cart)
            const totalCans = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalCans >= 4) {
              const subtotal = cart.reduce((sum, item) => sum + (Store.getProductById(item.productId).price * item.quantity), 0);
              discount = parseFloat((subtotal * 0.5).toFixed(2));
            } else {
              this.showToast('4 Cans Minimum', 'Add at least 4 items to apply 50% discount.', 'warning');
              return;
            }
          }
        }
      }

      // Place order in store
      const order = Store.placeOrder(address, discount, couponCode);
      if (order) {
        this.showToast('Order Placed!', `Your delivery order ${order.id} is queued.`, 'success');
        
        // Mark Coupon as fully consumed
        if (selectedCouponId) {
          const coupon = Store.state.coupons.find(c => c.id === selectedCouponId);
          if (coupon) {
            coupon.redeemed = true;
            // Remove coupon from options
            Store.state.coupons = Store.state.coupons.filter(c => c.id !== selectedCouponId);
            Store.save();
          }
        }

        closeCart();
        
        // Redirect to tracking view
        window.location.hash = '#tracking';
      }
    });
  },

  renderCart(state) {
    const itemsContainer = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const deliveryEl = document.getElementById('checkout-delivery');
    const deliveryCreditCountEl = document.getElementById('delivery-credit-count');
    const discountRow = document.getElementById('discount-row');
    const discountEl = document.getElementById('checkout-discount');
    const totalEl = document.getElementById('checkout-total');
    const couponSelect = document.getElementById('checkout-coupon');

    itemsContainer.innerHTML = '';

    if (state.cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <i class="fa-solid fa-cart-shopping"></i>
          <p>Your cart is empty</p>
        </div>
      `;
      subtotalEl.textContent = '$0.00';
      deliveryEl.textContent = '$0.00';
      totalEl.textContent = '$0.00';
      discountRow.classList.add('hidden');
      return;
    }

    let subtotal = 0;
    state.cart.forEach(item => {
      const prod = Store.getProductById(item.productId);
      if (!prod) return;

      subtotal += prod.price * item.quantity;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';
      itemDiv.innerHTML = `
        <div class="cart-item-image" style="background: ${prod.canBg}">
          <i class="fa-solid fa-whiskey-glass" style="${prod.id === 'pepsi-diet' ? 'color: #333' : ''}"></i>
        </div>
        <div class="cart-item-details">
          <div class="cart-item-name">${prod.name}</div>
          <div class="cart-item-price">$${prod.price.toFixed(2)} each</div>
        </div>
        <div class="cart-item-actions">
          <button class="btn-qty" data-action="decrease" data-id="${prod.id}">-</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="btn-qty" data-action="increase" data-id="${prod.id}">+</button>
        </div>
      `;

      // Event listeners for item quantities
      itemDiv.querySelectorAll('.btn-qty').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action');
          const productId = btn.getAttribute('data-id');
          if (action === 'increase') {
            Store.addToCart(productId);
          } else {
            Store.updateCartQuantity(productId, item.quantity - 1);
          }
        });
      });

      itemsContainer.appendChild(itemDiv);
    });

    // Delivery details
    const deliveryCredits = state.userStats.deliveryCredits;
    deliveryCreditCountEl.textContent = `(${deliveryCredits} Credit${deliveryCredits !== 1 ? 's' : ''} Available)`;
    const deliveryFee = deliveryCredits > 0 ? 0 : 2.50;

    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    deliveryEl.textContent = deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`;

    // Populate Coupon Selector dynamically with unlocked/active coupons
    const currentSelectedCoupon = couponSelect.value;
    couponSelect.innerHTML = '<option value="">No Coupon Selected</option>';
    
    state.coupons.forEach(coupon => {
      // Show coupons that are redeemed but not fully consumed by checkouts
      if (coupon.redeemed && coupon.id !== 'c3') { // c3 is scooter delivery credit, which increments delivery credits directly
        const option = document.createElement('option');
        option.value = coupon.id;
        option.textContent = `${coupon.title} (${coupon.code})`;
        couponSelect.appendChild(option);
      }
    });

    // Re-select value if still valid
    if (currentSelectedCoupon && [...couponSelect.options].some(o => o.value === currentSelectedCoupon)) {
      couponSelect.value = currentSelectedCoupon;
    }

    // Apply Coupon Discount Calculation
    let discount = 0;
    const selectedCouponId = couponSelect.value;
    if (selectedCouponId) {
      const coupon = state.coupons.find(c => c.id === selectedCouponId);
      if (coupon) {
        if (selectedCouponId === 'c1') {
          discount = 1.00;
        } else if (selectedCouponId === 'c2') {
          // Free Nitro upgrade logic
          const nitroItem = state.cart.find(i => i.productId === 'pepsi-nitro');
          if (nitroItem) {
            discount = 1.00;
          }
        } else if (selectedCouponId === 'c4') {
          const totalCans = state.cart.reduce((sum, item) => sum + item.quantity, 0);
          if (totalCans >= 4) {
            discount = parseFloat((subtotal * 0.5).toFixed(2));
          }
        }
      }
    }

    if (discount > 0) {
      discountRow.classList.remove('hidden');
      discountEl.textContent = `-$${discount.toFixed(2)}`;
    } else {
      discountRow.classList.add('hidden');
    }

    const total = Math.max(0, subtotal + deliveryFee - discount);
    totalEl.textContent = `$${total.toFixed(2)}`;
  },

  // --- STATE SYNCHRONIZATION ---
  syncUI(state) {
    // Header Stats
    document.getElementById('header-points').textContent = state.userStats.points;
    document.getElementById('header-co2').textContent = state.userStats.carbonSaved.toFixed(2);
    
    // Sidebar User Stats
    const userRank = state.leaderboard.find(l => l.isUser)?.rank || 3;
    document.getElementById('sidebar-rank').textContent = `Rank #${userRank}`;

    // Cart Badge count
    const cartCount = state.cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartBadge = document.getElementById('cart-count');
    cartBadge.textContent = cartCount;
    if (cartCount > 0) {
      cartBadge.classList.remove('hidden');
    } else {
      cartBadge.classList.add('hidden');
    }

    // Sidebar Live Badge status (order updates)
    const activeOrder = state.orders.find(o => o.status !== 'delivered');
    const trackingBadge = document.getElementById('tracking-active-badge');
    if (activeOrder) {
      trackingBadge.classList.remove('hidden');
    } else {
      trackingBadge.classList.add('hidden');
    }

    // Sidebar Rider Dashboard notification badge
    const riderJobBadge = document.getElementById('rider-job-badge');
    const pendingOrder = state.orders.find(o => o.status === 'placed');
    if (pendingOrder) {
      riderJobBadge.classList.remove('hidden');
    } else {
      riderJobBadge.classList.add('hidden');
    }

    // Render cart details if drawer is open
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer.classList.contains('open')) {
      this.renderCart(state);
    }

    // Pass update trigger to current rendering view module if active
    if (currentViewName && VIEWS[currentViewName]) {
      VIEWS[currentViewName].render(state);
    }
  },

  // --- TOAST NOTIFICATIONS ---
  showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'danger') icon = 'fa-circle-xmark';

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close Notification">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    // Hook up toast close action
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    // Auto remove toast after 4s
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideInLeft 0.3s reverse forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }
};

// Start application on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
export { Store as appStore };
export const showToast = App.showToast.bind(App);
