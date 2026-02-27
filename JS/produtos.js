// Parse Configuration
Parse.initialize(
    "KNpEdabAChZyTRn4higQ8dqzEQd88QjmZjswS59n",
    "1jRsUjRZmYww95gs5xmK7CC2iR39KowNyvmkfFLw"
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// State
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProducts = [];
let currentModalQuantity = 1;

// DOM Elements
const navbar = document.querySelector('.navbar');
const mobileMenu = document.getElementById('mobileMenu');
const mobileNav = document.getElementById('mobileNav');
const productsGrid = document.getElementById('productsGrid');
const loadingState = document.getElementById('loadingState');
const noResults = document.getElementById('noResults');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const searchInput = document.getElementById('searchInput');
const newsletterForm = document.getElementById('newsletterForm');
const cartIcon = document.getElementById('cartIcon');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Garantir que o modal de checkout comece fechado
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.classList.remove('active');
        checkoutModal.style.display = 'none';
    }
    
    setupEventListeners();
    updateCartCount();
    loadProducts();
    checkUrlParams();
});

// Setup Event Listeners
function setupEventListeners() {
    // Navbar scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu
    mobileMenu.addEventListener('click', toggleMobileMenu);

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileNav.contains(e.target)) {
            closeMobileMenu();
        }
    });

    // Filters
    categoryFilter.addEventListener('change', filterProducts);
    sortFilter.addEventListener('change', filterProducts);
    
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterProducts, 500);
    });

    // Cart icon
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        openCartModal();
    });

    // Newsletter
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input').value;
        showToast('Obrigado por se inscrever!', 'success');
        newsletterForm.reset();
    });

    // Checkout form
    document.getElementById('checkoutForm').addEventListener('submit', processCheckout);
}

// Mobile Menu Functions
function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
    mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
    
    const spans = mobileMenu.querySelectorAll('span');
    if (mobileMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
}

function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    mobileNav.style.display = 'none';
    const spans = mobileMenu.querySelectorAll('span');
    spans[0].style.transform = 'none';
    spans[1].style.opacity = '1';
    spans[2].style.transform = 'none';
}

// Cart Functions
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
    });
}

function openCartModal() {
    const modal = document.getElementById('cartModal');
    renderCartItems();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderCartItems() {
    const cartBody = document.getElementById('cartModalBody');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty">
                <span class="cart-empty-icon">🛒</span>
                <p>Seu carrinho está vazio</p>
                <button class="btn-outline-dark" onclick="closeCartModal()">Continuar Comprando</button>
            </div>
        `;
        cartTotal.textContent = 'R$ 0,00';
        checkoutBtn.disabled = true;
        return;
    }
    
    let total = 0;
    let itemsHtml = '<div class="cart-items-list">';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        itemsHtml += `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image || 'https://images.unsplash.com/photo-1592945403407-9c8b93047c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'}" 
                     alt="${item.name}" 
                     class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                    <div class="cart-item-quantity">
                        <button onclick="updateCartQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantity('${item.id}', 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">&times;</button>
            </div>
        `;
    });
    
    itemsHtml += '</div>';
    cartBody.innerHTML = itemsHtml;
    cartTotal.textContent = `R$ ${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
}

function updateCartQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    if (item.stock && newQuantity > item.stock) {
        showToast('Quantidade máxima: ' + item.stock, 'error');
        return;
    }
    
    item.quantity = newQuantity;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    showToast('Item removido do carrinho', 'success');
}

// Checkout Functions
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('Carrinho vazio', 'error');
        return;
    }
    
    closeCartModal();
    
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    let itemsHtml = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemsHtml += `
            <div class="checkout-item">
                <span>${item.name} (x${item.quantity})</span>
                <span>R$ ${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });
    
    checkoutItems.innerHTML = itemsHtml;
    checkoutTotal.textContent = `R$ ${total.toFixed(2)}`;
    
    // FORÇAR abertura do modal
    checkoutModal.classList.add('active');
    checkoutModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkoutModal');
    checkoutModal.classList.remove('active');
    checkoutModal.style.display = 'none';
    document.body.style.overflow = '';
}

async function processCheckout(e) {
    e.preventDefault();
    
    const name = document.getElementById('checkoutName').value;
    const email = document.getElementById('checkoutEmail').value;
    const phone = document.getElementById('checkoutPhone').value;
    const address = document.getElementById('checkoutAddress').value;
    const payment = document.getElementById('checkoutPayment').value;
    
    showLoading();
    
    try {
        // Create Order in Parse
        const Order = Parse.Object.extend('Order');
        const order = new Order();
        
        order.set('customerName', name);
        order.set('customerEmail', email);
        order.set('customerPhone', phone);
        order.set('customerAddress', address);
        order.set('paymentMethod', payment);
        order.set('items', cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })));
        order.set('total', cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
        order.set('status', 'pending');
        order.set('createdAt', new Date());
        
        // Set ACL
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(false);
        acl.setRoleWriteAccess('Admin', true);
        order.setACL(acl);
        
        await order.save();
        
        // Clear cart
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        
        closeCheckoutModal();
        showToast('Pedido realizado com sucesso!', 'success');
        
        // Reset form
        document.getElementById('checkoutForm').reset();
        
    } catch (error) {
        console.error('Error processing order:', error);
        showToast('Erro ao processar pedido', 'error');
    } finally {
        hideLoading();
    }
}

// Product Functions
async function loadProducts() {
    showLoading();
    
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        query.descending('createdAt');
        
        const results = await query.find();
        
        allProducts = results.map(product => ({
            id: product.id,
            name: product.get('name') || 'Perfume AromaZ',
            description: product.get('description') || 'Fragrância exclusiva',
            price: product.get('price') || 199.90,
            category: product.get('category') || 'exclusivo',
            stock: product.get('stock') || 0,
            image: product.get('image') ? product.get('image').url() : 'https://images.unsplash.com/photo-1592945403407-9c8b93047c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
        }));
        
        filterProducts();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Erro ao carregar produtos', 'error');
    } finally {
        hideLoading();
    }
}

function filterProducts() {
    const category = categoryFilter.value;
    const sort = sortFilter.value;
    const search = searchInput.value.toLowerCase();
    
    let filtered = [...allProducts];
    
    // Apply category filter
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }
    
    // Apply search filter
    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) || 
            p.description.toLowerCase().includes(search)
        );
    }
    
    // Apply sorting
    switch (sort) {
        case 'menorPreco':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'maiorPreco':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'nome':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            filtered.sort((a, b) => b.id.localeCompare(a.id));
    }
    
    renderProducts(filtered);
}

function renderProducts(products) {
    if (products.length === 0) {
        productsGrid.innerHTML = '';
        noResults.classList.add('active');
        return;
    }
    
    noResults.classList.remove('active');
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="openProductModal('${product.id}')">
            ${product.stock < 5 && product.stock > 0 ? '<div class="product-badge">Últimas unidades</div>' : ''}
            ${product.stock === 0 ? '<div class="product-badge">Esgotado</div>' : ''}
            <div class="product-image" style="background-image: url('${product.image}')"></div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-footer">
                    <span class="product-price">R$ ${product.price.toFixed(2)}</span>
                    <button class="add-to-cart" onclick="event.stopPropagation(); addToCart('${product.id}')" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock === 0 ? '×' : '+'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const modalBody = document.getElementById('productModalBody');
    
    currentModalQuantity = 1;
    
    modalBody.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="modal-product-image">
        <div class="modal-product-category">${product.category}</div>
        <h2 class="modal-product-name">${product.name}</h2>
        <p class="modal-product-description">${product.description}</p>
        <div class="modal-product-stock ${product.stock < 5 ? 'low' : ''}">
            ${product.stock > 0 ? `${product.stock} unidades disponíveis` : 'Produto esgotado'}
        </div>
        <div class="modal-product-price">R$ ${product.price.toFixed(2)}</div>
        
        ${product.stock > 0 ? `
            <div class="quantity-selector">
                <button class="quantity-btn" onclick="updateModalQuantity(-1)">-</button>
                <span class="quantity-value" id="modalQuantity">1</span>
                <button class="quantity-btn" onclick="updateModalQuantity(1, ${product.stock})">+</button>
            </div>
            <button class="modal-add-to-cart" onclick="addToCart('${product.id}')">
                Adicionar ao Carrinho
            </button>
        ` : `
            <button class="modal-add-to-cart" disabled>Produto Esgotado</button>
        `}
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function updateModalQuantity(change, max = Infinity) {
    const quantitySpan = document.getElementById('modalQuantity');
    if (!quantitySpan) return;
    
    currentModalQuantity = parseInt(quantitySpan.textContent) + change;
    
    if (currentModalQuantity < 1) {
        currentModalQuantity = 1;
    }
    
    if (currentModalQuantity > max) {
        currentModalQuantity = max;
    }
    
    quantitySpan.textContent = currentModalQuantity;
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const quantity = currentModalQuantity || 1;
    
    if (product.stock < quantity) {
        showToast('Quantidade indisponível', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity + quantity > product.stock) {
            showToast('Quantidade excede o estoque', 'error');
            return;
        }
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity,
            stock: product.stock
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Produto adicionado ao carrinho!', 'success');
    
    closeProductModal();
}

// URL Parameters
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const categoria = params.get('categoria');
    
    if (categoria && categoryFilter) {
        categoryFilter.value = categoria;
        filterProducts();
    }
}

// Loading Functions
function showLoading() {
    if (loadingState) {
        loadingState.classList.add('active');
    }
}

function hideLoading() {
    if (loadingState) {
        loadingState.classList.remove('active');
    }
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}