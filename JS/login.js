// Parse Configuration
Parse.initialize(
    "KNpEdabAChZyTRn4higQ8dqzEQd88QjmZjswS59n",
    "1jRsUjRZmYww95gs5xmK7CC2iR39KowNyvmkfFLw"
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// State
let currentUser = null;
let isAdmin = false;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const navbar = document.querySelector('.navbar');
const mobileMenu = document.getElementById('mobileMenu');
const mobileNav = document.getElementById('mobileNav');
const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');
const loginContainer = document.getElementById('loginContainer');
const adminDashboard = document.getElementById('adminDashboard');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    updateCartCount();
    await checkCurrentUser(); // Verifica se já há usuário logado
});

// Setup Event Listeners
function setupEventListeners() {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    mobileMenu?.addEventListener('click', toggleMobileMenu);
    document.addEventListener('click', (e) => {
        if (!mobileMenu?.contains(e.target) && !mobileNav?.contains(e.target)) {
            closeMobileMenu();
        }
    });

    // Login forms
    document.getElementById('adminLoginForm')?.addEventListener('submit', adminLogin);
    document.getElementById('clientLoginForm')?.addEventListener('submit', clientLogin);

    // File upload
    const fileUploadArea = document.getElementById('fileUploadArea');
    if (fileUploadArea) {
        fileUploadArea.addEventListener('click', () => document.getElementById('productImage').click());
        document.getElementById('productImage')?.addEventListener('change', handleImageUpload);
    }

    // Product form
    document.getElementById('productAdminForm')?.addEventListener('submit', saveProduct);
}

// Mobile Menu
function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
    mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
    const spans = mobileMenu.querySelectorAll('span');
    if (mobileMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    } else {
        spans.forEach(span => span.style.transform = 'none');
        spans[1].style.opacity = '1';
    }
}

function closeMobileMenu() {
    mobileMenu?.classList.remove('active');
    if (mobileNav) mobileNav.style.display = 'none';
    const spans = mobileMenu?.querySelectorAll('span');
    if (spans) {
        spans.forEach(span => span.style.transform = 'none');
        spans[1].style.opacity = '1';
    }
}

// Cart
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

// Auth
async function checkCurrentUser() {
    currentUser = Parse.User.current();
    if (currentUser) {
        const isAdminUser = await checkIfAdmin(currentUser);
        if (isAdminUser) {
            isAdmin = true;
            showAdminDashboard();
            loadAdminData();
        } else {
            isAdmin = false;
            showLoginForms(); // Cliente não vê o dashboard
            showToast('Você está logado como cliente. Use uma conta admin para acessar o painel.', 'info');
        }
    } else {
        showLoginForms();
    }
}

async function checkIfAdmin(user) {
    try {
        const roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo('name', 'Admin');
        roleQuery.equalTo('users', user);
        const role = await roleQuery.first();
        return !!role;
    } catch (error) {
        console.error('Error checking admin:', error);
        return false;
    }
}

// Admin Login
async function adminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    if (!email || !password) return showToast('Preencha todos os campos', 'error');

    showLoading();
    try {
        const user = await Parse.User.logIn(email, password);
        const isAdminUser = await checkIfAdmin(user);
        if (isAdminUser) {
            currentUser = user;
            isAdmin = true;
            showAdminDashboard();
            loadAdminData();
            showToast('Login admin realizado!', 'success');
        } else {
            await Parse.User.logOut();
            showToast('Acesso negado: não é admin', 'error');
        }
    } catch (error) {
        showToast('Email ou senha incorretos', 'error');
    } finally {
        hideLoading();
    }
}

// Client Login
async function clientLogin(e) {
    e.preventDefault();
    const email = document.getElementById('clientEmail').value;
    const password = document.getElementById('clientPassword').value;
    if (!email || !password) return showToast('Preencha todos os campos', 'error');

    showLoading();
    try {
        const user = await Parse.User.logIn(email, password);
        const isAdminUser = await checkIfAdmin(user);
        if (isAdminUser) {
            showToast('Use o login de admin', 'error');
            await Parse.User.logOut();
        } else {
            currentUser = user;
            showToast('Login realizado! Redirecionando...', 'success');
            setTimeout(() => window.location.href = '../index.html', 1500);
        }
    } catch (error) {
        showToast('Email ou senha incorretos', 'error');
    } finally {
        hideLoading();
    }
}

// Admin Logout
async function adminLogout() {
    try {
        await Parse.User.logOut();
        currentUser = null;
        isAdmin = false;
        showLoginForms();
        showToast('Logout realizado!', 'success');
    } catch (error) {
        showToast('Erro ao fazer logout', 'error');
    }
}

// UI Helpers
function showLoginForms() {
    loginContainer.style.display = 'grid';
    adminDashboard.style.display = 'none';
    adminDashboard.classList.remove('active');
}

function showAdminDashboard() {
    loginContainer.style.display = 'none';
    adminDashboard.style.display = 'block';
    adminDashboard.classList.add('active');
}

function showClientRegister() {
    showToast('Função de registro em desenvolvimento', 'info');
}

// Admin Tabs
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');
    if (tab === 'products') loadProducts();
    if (tab === 'orders') loadOrders();
    if (tab === 'users') loadUsers();
}

// Load Admin Data
async function loadAdminData() {
    await Promise.all([loadStats(), loadRecentOrders()]);
}

async function loadStats() {
    try {
        const productCount = await new Parse.Query('Product').count();
        const orderCount = await new Parse.Query('Order').count();
        const userCount = await new Parse.Query(Parse.User).count();
        const orders = await new Parse.Query('Order').find();
        const revenue = orders.reduce((sum, o) => sum + (o.get('total') || 0), 0);
        document.getElementById('totalProducts').textContent = productCount;
        document.getElementById('totalOrders').textContent = orderCount;
        document.getElementById('totalUsers').textContent = userCount;
        document.getElementById('totalRevenue').textContent = `R$ ${revenue.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentOrders() {
    try {
        const query = new Parse.Query('Order');
        query.descending('createdAt');
        query.limit(5);
        const orders = await query.find();
        const tbody = document.getElementById('recentOrdersBody');
        if (!tbody) return;
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum pedido encontrado</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(o => `
            <tr>
                <td>#${o.id.slice(-6)}</td>
                <td>${o.get('customerName') || 'N/A'}</td>
                <td>R$ ${o.get('total')?.toFixed(2) || '0,00'}</td>
                <td><span class="status-badge status-${o.get('status') || 'pending'}">${o.get('status') || 'pending'}</span></td>
                <td>${new Date(o.get('createdAt')).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Products
async function loadProducts() {
    const tbody = document.getElementById('productsBody');
    if (!tbody) return;
    try {
        const products = await new Parse.Query('Product').descending('createdAt').find();
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum produto encontrado</td></tr>';
            return;
        }
        tbody.innerHTML = products.map(p => {
            const img = p.get('image') ? p.get('image').url() : '';
            return `
                <tr>
                    <td>${img ? `<img src="${img}" class="product-image-small">` : '📦'}</td>
                    <td>${p.get('name') || 'Sem nome'}</td>
                    <td>${p.get('category') || 'N/A'}</td>
                    <td>R$ ${p.get('price')?.toFixed(2) || '0,00'}</td>
                    <td>${p.get('stock') || 0}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="editProduct('${p.id}')">Editar</button>
                        <button class="action-btn delete-btn" onclick="deleteProduct('${p.id}')">Excluir</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #e74c3c;">Erro ao carregar produtos</td></tr>';
    }
}

function showAddProductModal() {
    if (!isAdmin) return showToast('Acesso negado', 'error');
    document.getElementById('productModalTitle').textContent = 'Novo Produto';
    document.getElementById('productAdminForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('productAdminModal').classList.add('active');
}

async function editProduct(productId) {
    if (!isAdmin) return showToast('Acesso negado', 'error');
    showLoading();
    try {
        const product = await new Parse.Query('Product').get(productId);
        document.getElementById('productModalTitle').textContent = 'Editar Produto';
        document.getElementById('productId').value = productId;
        document.getElementById('productName').value = product.get('name') || '';
        document.getElementById('productDescription').value = product.get('description') || '';
        document.getElementById('productCategory').value = product.get('category') || '';
        document.getElementById('productPrice').value = product.get('price') || '';
        document.getElementById('productStock').value = product.get('stock') || '';
        const img = product.get('image');
        if (img) {
            document.getElementById('imagePreview').src = img.url();
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
        }
        document.getElementById('productAdminModal').classList.add('active');
    } catch (error) {
        showToast('Erro ao carregar produto', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteProduct(productId) {
    if (!isAdmin || !confirm('Excluir produto?')) return;
    showLoading();
    try {
        const product = await new Parse.Query('Product').get(productId);
        await product.destroy();
        showToast('Produto excluído!', 'success');
        loadProducts();
        loadStats();
    } catch (error) {
        showToast('Erro ao excluir', 'error');
    } finally {
        hideLoading();
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast('Arquivo muito grande (máx 5MB)', 'error');
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('imagePreview').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('uploadPlaceholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

async function saveProduct(e) {
    e.preventDefault();
    if (!isAdmin) return showToast('Acesso negado', 'error');
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const category = document.getElementById('productCategory').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const imageFile = document.getElementById('productImage').files[0];

    if (!name || !description || !category || isNaN(price)) {
        return showToast('Preencha todos os campos', 'error');
    }

    showLoading();
    try {
        const Product = Parse.Object.extend('Product');
        let product;
        if (id) {
            product = await new Parse.Query(Product).get(id);
        } else {
            product = new Product();
        }
        product.set('name', name);
        product.set('description', description);
        product.set('category', category);
        product.set('price', price);
        product.set('stock', stock || 0);
        if (imageFile) {
            const parseFile = new Parse.File('product.jpg', imageFile);
            await parseFile.save();
            product.set('image', parseFile);
        }
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setRoleWriteAccess('Admin', true);
        product.setACL(acl);
        await product.save();
        showToast(id ? 'Produto atualizado!' : 'Produto criado!', 'success');
        closeProductAdminModal();
        loadProducts();
        loadStats();
    } catch (error) {
        showToast('Erro ao salvar', 'error');
    } finally {
        hideLoading();
    }
}

function closeProductAdminModal() {
    document.getElementById('productAdminModal').classList.remove('active');
}

// Orders (placeholder)
async function loadOrders() {
    const tbody = document.getElementById('ordersBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Em desenvolvimento</td></tr>';
}

// Users (placeholder)
async function loadUsers() {
    const tbody = document.getElementById('usersBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Em desenvolvimento</td></tr>';
}

// Loading/Toast
function showLoading() { loadingOverlay?.classList.add('active'); }
function hideLoading() { loadingOverlay?.classList.remove('active'); }

function showToast(message, type = 'success') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}