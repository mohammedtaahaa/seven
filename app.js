// ===========================
// SE7EN – Jersey Store
// app.js – Full app logic
// ===========================

// ====== SUPABASE CONFIG ======
const SUPABASE_URL = 'https://qqbrvcbhjtkeppgwqrnp.supabase.co/rest/v1/';        // Replace with your Supabase API URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYnJ2Y2JoanRrZXBwZ3dxcm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODY2NTUsImV4cCI6MjA5Mjc2MjY1NX0.BBOU8zsf5jOY_dsxISwjsotUL2hO-mnDwChJ0cFA9RQbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYnJ2Y2JoanRrZXBwZ3dxcm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODY2NTUsImV4cCI6MjA5Mjc2MjY1NX0.BBOU8zsf5jOY_dsxISwjsotUL2hO-mnDwChJ0cFA9RQ'; // Replace with your Supabase anon key

let supabaseClient = null;
try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase not initialized:', e.message);
}

// ====== RAZORPAY CONFIG ======
const RAZORPAY_KEY = 'YOUR_RAZORPAY_KEY_ID'; // Replace with your Razorpay Key ID

// ====== STATE ======
let cart = JSON.parse(localStorage.getItem('se7en_cart') || '[]');
let currentFilter = 'all';
let allProducts = [];
let pendingProduct = null;
let selectedSize = null;
let customerAddress = null;

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
  await loadProductsFromSupabase();
  updateCartUI();
  initNavScroll();
});

// ====== LOAD PRODUCTS FROM SUPABASE ======
async function loadProductsFromSupabase() {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .eq('active', true);

    if (error) throw error;

    allProducts = data.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      badge: p.badge,
      desc: p.description,
      image: p.image_url,
      sizes: p.sizes || ['S', 'M', 'L', 'XL', 'XXL']
    }));

    renderProducts(allProducts);

  } catch (err) {
    console.error('Failed to load products from Supabase:', err);
    document.getElementById('productsGrid').innerHTML = `
      <p style="text-align:center;color:var(--gray);grid-column:1/-1;padding:40px">
        Unable to load products. Please check your Supabase connection.
      </p>`;
  }
}

// ====== NAVBAR SCROLL ======
function initNavScroll() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ====== RENDER PRODUCTS ======
function renderProducts(items) {
  const grid = document.getElementById('productsGrid');
  if (!items.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--gray);grid-column:1/-1;padding:40px">No jerseys found in this category</p>';
    return;
  }
  grid.innerHTML = items.map(p => `
    <div class="product-card" data-category="${p.category}" style="animation: fadeUp 0.4s ease both">
      <div class="product-image-wrap">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">`
          : `<div class="product-placeholder">👕</div>`
        }
        ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
      </div>
      <div class="product-info">
        <div class="product-category">${p.category ? p.category.toUpperCase() : ''}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc || ''}</div>
        <div class="product-footer">
          <div class="product-price">₹${p.price.toLocaleString('en-IN')}</div>
          <button class="add-cart-btn" onclick="openSizeModal(${p.id})">ADD TO CART</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ====== FILTER ======
function filterProducts(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat);
  renderProducts(filtered);
}

// ====== SIZE MODAL ======
function openSizeModal(productId) {
  pendingProduct = allProducts.find(p => p.id === productId);
  selectedSize = null;
  document.getElementById('sizeProductName').textContent = pendingProduct.name;
  document.getElementById('sizeGrid').innerHTML = pendingProduct.sizes.map(s => `
    <button class="size-option" onclick="selectSize('${s}', this)">${s}</button>
  `).join('');
  openModal('sizeModal');
}

function selectSize(size, el) {
  selectedSize = size;
  document.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

function confirmAddToCart() {
  if (!selectedSize) {
    showToast('Please select a size!');
    return;
  }
  closeModal('sizeModal');
  addToCart(pendingProduct, selectedSize);
}

// ====== CART LOGIC ======
function addToCart(product, size) {
  const existing = cart.find(i => i.id === product.id && i.size === size);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, size, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast(`${product.name} (${size}) added to cart!`);
  setTimeout(() => toggleCart(true), 300);
}

function removeFromCart(id, size) {
  cart = cart.filter(i => !(i.id === id && i.size === size));
  saveCart();
  updateCartUI();
}

function changeQty(id, size, delta) {
  const item = cart.find(i => i.id === id && i.size === size);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id, size);
  else { saveCart(); updateCartUI(); }
}

function saveCart() {
  localStorage.setItem('se7en_cart', JSON.stringify(cart));
}

function resetCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartUI() {
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCount').textContent = totalItems;

  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');

  if (!cart.length) {
    itemsEl.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    footerEl.style.display = 'none';
    return;
  }

  footerEl.style.display = 'block';
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover">`
          : '👕'
        }
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-size">SIZE: ${item.size}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.size}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, '${item.size}', 1)">+</button>
          <button class="remove-item" onclick="removeFromCart(${item.id}, '${item.size}')">✕ Remove</button>
        </div>
      </div>
      <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
    </div>
  `).join('');

  document.getElementById('cartTotal').textContent = `₹${cartTotal().toLocaleString('en-IN')}`;
}

// ====== CART TOGGLE ======
function toggleCart(forceOpen) {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  const isOpen = sidebar.classList.contains('open');
  if (forceOpen === true || !isOpen) {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ====== CHECKOUT FLOW ======
function proceedToCheckout() {
  if (!cart.length) { showToast('Your cart is empty!'); return; }
  toggleCart(false);
  setTimeout(() => openModal('addressModal'), 350);
}

function proceedToPayment() {
  const name = document.getElementById('addrName').value.trim();
  const phone = document.getElementById('addrPhone').value.trim();
  const line1 = document.getElementById('addrLine1').value.trim();
  const city = document.getElementById('addrCity').value.trim();
  const pin = document.getElementById('addrPin').value.trim();
  const state = document.getElementById('addrState').value.trim();

  if (!name || !phone || !line1 || !city || !pin || !state) {
    showToast('Please fill all required fields');
    return;
  }

  if (!/^\d{6}$/.test(pin)) {
    showToast('Enter a valid 6-digit pincode');
    return;
  }

  customerAddress = {
    name,
    phone,
    address: `${line1}, ${document.getElementById('addrLine2').value.trim()}, ${city} – ${pin}, ${state}`
  };

  closeModal('addressModal');
  setTimeout(initRazorpay, 300);
}

// ====== RAZORPAY ======
function initRazorpay() {
  const total = cartTotal();
  const amountPaise = total * 100;

  const options = {
    key: RAZORPAY_KEY,
    amount: amountPaise,
    currency: 'INR',
    name: 'SE7EN',
    description: `Jersey Order – ${cart.length} item(s)`,
    prefill: {
      name: customerAddress?.name || '',
      contact: customerAddress?.phone || ''
    },
    notes: {
      address: customerAddress?.address || '',
      items: cart.map(i => `${i.name} (${i.size}) x${i.qty}`).join(', ')
    },
    theme: {
      color: '#CC0000'
    },
    handler: async function(response) {
      await saveOrderToSupabase(response.razorpay_payment_id);
      showOrderSuccess(response.razorpay_payment_id);
    },
    modal: {
      ondismiss: function() {
        showToast('Payment cancelled. Try again.');
      }
    }
  };

  if (typeof Razorpay === 'undefined') {
    showToast('Razorpay not configured yet. Simulating order...');
    setTimeout(() => {
      const fakeId = 'DEMO_' + Date.now();
      saveOrderToSupabase(fakeId);
      showOrderSuccess(fakeId);
    }, 1000);
    return;
  }

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    showToast('Payment failed: ' + response.error.description);
  });
  rzp.open();
}

// ====== SAVE ORDER TO SUPABASE ======
async function saveOrderToSupabase(paymentId) {
  if (!supabaseClient) {
    console.log('Supabase not configured. Order details:', {
      payment_id: paymentId,
      customer: customerAddress,
      items: cart,
      total: cartTotal()
    });
    return;
  }

  try {
    const { error } = await supabaseClient.from('orders').insert({
      payment_id: paymentId,
      customer_name: customerAddress?.name,
      customer_phone: customerAddress?.phone,
      delivery_address: customerAddress?.address,
      items: JSON.stringify(cart),
      total_amount: cartTotal(),
      status: 'confirmed',
      created_at: new Date().toISOString()
    });
    if (error) console.error('Supabase order save error:', error);
  } catch (e) {
    console.error('Order save error:', e);
  }
}

// ====== ORDER SUCCESS ======
function showOrderSuccess(paymentId) {
  document.getElementById('successOrderId').textContent = 'Payment ID: ' + paymentId;
  openModal('successModal');
}

// ====== MODAL HELPERS ======
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

// ====== MOBILE MENU ======
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ====== TOAST NOTIFICATION ======
function showToast(msg) {
  const existing = document.querySelector('.se7en-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'se7en-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--red);
    color: white;
    padding: 12px 24px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 1px;
    z-index: 9999;
    animation: fadeUp 0.3s ease;
    white-space: nowrap;
    max-width: 90vw;
    text-align: center;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
