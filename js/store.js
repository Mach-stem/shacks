// Centralized Storage & Simulation State Manager for Pepsi Smart Delivery & Recycling System

const DEFAULT_PRODUCTS = [
  {
    id: 'pepsi-classic',
    name: 'Pepsi Classic',
    tagline: 'The Legendary Original',
    price: 1.99,
    calories: 150,
    color: '#004B87',
    canBg: 'linear-gradient(135deg, #004b87 0%, #002f5c 100%)',
    description: 'The bold, refreshing cola that started it all. Crisp, sweet, and satisfying.'
  },
  {
    id: 'pepsi-zero-sugar',
    name: 'Pepsi Zero Sugar',
    tagline: 'Zero Sugar, Bold Taste',
    price: 2.19,
    calories: 0,
    color: '#0B0C10',
    canBg: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
    description: 'Maximum taste, zero sugar. Infused with ginseng for a robust flavor profile.'
  },
  {
    id: 'pepsi-diet',
    name: 'Diet Pepsi',
    tagline: 'Light & Crisp Refreshment',
    price: 1.99,
    calories: 0,
    color: '#a0a0a0',
    canBg: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)',
    textColor: '#333',
    description: 'Light, crisp, and refreshingly calorie-free. The perfect guilt-free pick-me-up.'
  },
  {
    id: 'pepsi-mango-zero',
    name: 'Pepsi Mango Zero',
    tagline: 'A Splash of Tropical Mango',
    price: 2.29,
    calories: 0,
    color: '#ff8c00',
    canBg: 'linear-gradient(135deg, #ff8c00 0%, #e52d27 100%)',
    description: 'The zero sugar bold flavor of Pepsi mixed with a splash of sweet, juicy mango.'
  },
  {
    id: 'pepsi-nitro',
    name: 'Pepsi Nitro Draft',
    tagline: 'Infused with Nitrogen',
    price: 2.99,
    calories: 160,
    color: '#d4af37',
    canBg: 'linear-gradient(135deg, #d4af37 0%, #85581A 100%)',
    description: 'Draft cola infused with nitrogen for a velvety-smooth, cascading foam head.'
  }
];

const DEFAULT_LEADERBOARD = [
  { name: 'Alex Soda-Saver', cans: 245, points: 2450, co2: 20.8, rank: 1 },
  { name: 'Sarah Green-Can', cans: 189, points: 1890, co2: 16.0, rank: 2 },
  { name: 'You (Eco-Champion)', cans: 0, points: 0, co2: 0.0, rank: 3, isUser: true },
  { name: 'Michael Recycle', cans: 112, points: 1120, co2: 9.5, rank: 4 },
  { name: 'Emma Planet-Lover', cans: 84, points: 840, co2: 7.1, rank: 5 }
];

const DEFAULT_COUPONS = [
  { id: 'c1', title: '$1.00 Off Pepsi Zero Sugar', pointsCost: 100, code: 'ZERO100', redeemed: false, description: 'Redeemable on your next order catalog checkout.' },
  { id: 'c2', title: 'Free Pepsi Nitro Upgrade', pointsCost: 150, code: 'NITROPGRADE', redeemed: false, description: 'Get a Pepsi Nitro for the price of Pepsi Classic.' },
  { id: 'c3', title: 'Free Smart Scooter Delivery', pointsCost: 200, code: 'ECODELIVERY', redeemed: false, description: 'Zero delivery fee on your next Pep-Scooter delivery.' },
  { id: 'c4', title: '50% Off Any 4-Pack', pointsCost: 350, code: '4PACK50', redeemed: false, description: 'Huge savings on your next bulk delivery order.' }
];

export const Store = {
  state: {
    cart: [],
    orders: [],
    userStats: {
      recycledCount: 0,
      carbonSaved: 0.0, // kg CO2
      points: 0,
      deliveryCredits: 1 // starts with 1 free delivery
    },
    leaderboard: [],
    coupons: [],
    activeRiderOrder: null // order being handled by the current rider view
  },

  init() {
    // Load or initialize state
    const saved = localStorage.getItem('pepsi_smart_system_state');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading state from localStorage, resetting', e);
        this.resetState();
      }
    } else {
      this.resetState();
    }
  },

  resetState() {
    this.state = {
      cart: [],
      orders: [],
      userStats: {
        recycledCount: 0,
        carbonSaved: 0.0,
        points: 0,
        deliveryCredits: 1
      },
      leaderboard: [...DEFAULT_LEADERBOARD],
      coupons: [...DEFAULT_COUPONS],
      activeRiderOrder: null
    };
    this.save();
  },

  save() {
    localStorage.setItem('pepsi_smart_system_state', JSON.stringify(this.state));
    // Trigger window event for components to react
    window.dispatchEvent(new CustomEvent('pepsi-store-update', { detail: this.state }));
  },

  getProducts() {
    return DEFAULT_PRODUCTS;
  },

  getProductById(id) {
    return DEFAULT_PRODUCTS.find(p => p.id === id);
  },

  // --- CART MANAGEMENT ---
  getCart() {
    return this.state.cart;
  },

  addToCart(productId) {
    const existing = this.state.cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.state.cart.push({ productId, quantity: 1 });
    }
    this.save();
  },

  updateCartQuantity(productId, quantity) {
    const item = this.state.cart.find(item => item.productId === productId);
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        this.state.cart = this.state.cart.filter(i => i.productId !== productId);
      }
      this.save();
    }
  },

  clearCart() {
    this.state.cart = [];
    this.save();
  },

  // --- ORDERS MANAGEMENT ---
  getOrders() {
    return this.state.orders;
  },

  placeOrder(address, discountAmount = 0, promoCode = '') {
    if (this.state.cart.length === 0) return null;

    const items = this.state.cart.map(item => {
      const prod = this.getProductById(item.productId);
      return {
        ...item,
        name: prod.name,
        price: prod.price,
        color: prod.color
      };
    });

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deliveryFee = this.state.userStats.deliveryCredits > 0 ? 0 : 2.50;
    
    // Consume delivery credit if free delivery is active
    if (deliveryFee === 0 && this.state.userStats.deliveryCredits > 0) {
      this.state.userStats.deliveryCredits--;
    }

    const total = Math.max(0, subtotal + deliveryFee - discountAmount);

    const newOrder = {
      id: 'PEPS-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      promoCode,
      total: parseFloat(total.toFixed(2)),
      address,
      status: 'placed', // placed, accepted, preparing, out_for_delivery, delivered
      statusHistory: [
        { status: 'placed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ],
      rider: null,
      deliveryProgress: 0, // 0 to 100%
      // Map positions for tracker
      mapPath: this.generateMapPoints()
    };

    this.state.orders.unshift(newOrder);
    this.clearCart();
    this.save();
    return newOrder;
  },

  updateOrderStatus(orderId, status) {
    const order = this.state.orders.find(o => o.id === orderId);
    if (order && order.status !== status) {
      order.status = status;
      order.statusHistory.push({
        status,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.save();
    }
  },

  updateOrderProgress(orderId, progress) {
    const order = this.state.orders.find(o => o.id === orderId);
    if (order) {
      order.deliveryProgress = progress;
      if (progress >= 100 && order.status !== 'delivered') {
        order.status = 'delivered';
        order.statusHistory.push({
          status: 'delivered',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      this.save();
    }
  },

  // Helper to generate path coordinates for simulation map
  generateMapPoints() {
    // Return list of x,y coordinates on a 200x200 grid
    // Starting at Pepsi Warehouse (30, 170) -> intersections -> Customer (170, 30)
    // We can define a few distinct routes
    const routeIndex = Math.floor(Math.random() * 3);
    const routes = [
      [ {x: 30, y: 170}, {x: 30, y: 100}, {x: 100, y: 100}, {x: 100, y: 30}, {x: 170, y: 30} ],
      [ {x: 30, y: 170}, {x: 120, y: 170}, {x: 120, y: 80}, {x: 170, y: 80}, {x: 170, y: 30} ],
      [ {x: 30, y: 170}, {x: 30, y: 30}, {x: 170, y: 30} ]
    ];
    return routes[routeIndex];
  },

  // --- RECYCLING MODULE ---
  recycleCan(canType) {
    // Add stats
    this.state.userStats.recycledCount += 1;
    // An aluminum can saves ~85g of CO2 (0.085 kg)
    const carbonSavedInc = 0.085;
    this.state.userStats.carbonSaved = parseFloat((this.state.userStats.carbonSaved + carbonSavedInc).toFixed(3));
    // 10 points per recycled can
    this.state.userStats.points += 10;

    // Update leaderboard
    const userIndex = this.state.leaderboard.findIndex(l => l.isUser);
    if (userIndex !== -1) {
      const user = this.state.leaderboard[userIndex];
      user.cans += 1;
      user.points += 10;
      user.co2 = parseFloat((user.co2 + carbonSavedInc).toFixed(1));

      // Sort leaderboard by points descending
      this.state.leaderboard.sort((a, b) => b.points - a.points);
      
      // Update ranks
      this.state.leaderboard.forEach((item, idx) => {
        item.rank = idx + 1;
      });
    }

    this.save();
    return {
      pointsEarned: 10,
      carbonSavedInc,
      newTotalCans: this.state.userStats.recycledCount,
      newTotalPoints: this.state.userStats.points
    };
  },

  redeemCoupon(couponId) {
    const coupon = this.state.coupons.find(c => c.id === couponId);
    if (coupon && !coupon.redeemed && this.state.userStats.points >= coupon.pointsCost) {
      this.state.userStats.points -= coupon.pointsCost;
      coupon.redeemed = true;
      
      // If it's a delivery credit, add to user's credits
      if (couponId === 'c3') {
        this.state.userStats.deliveryCredits += 1;
      }

      this.save();
      return true;
    }
    return false;
  }
};
