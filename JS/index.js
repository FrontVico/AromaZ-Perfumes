// Initialize Parse
Parse.initialize(
    "KNpEdabAChZyTRn4higQ8dqzEQd88QjmZjswS59n",
    "1jRsUjRZmYww95gs5xmK7CC2iR39KowNyvmkfFLw"
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// State
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const navbar = document.querySelector('.navbar');
const mobileMenu = document.getElementById('mobileMenu');
const mobileNav = document.getElementById('mobileNav');
const cartIcon = document.getElementById('cartIcon');
const featuredProducts = document.getElementById('featuredProducts');
const newsletterForm = document.getElementById('newsletterForm');

// Update cart count
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu
mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
    
    // Animate hamburger
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
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileMenu.classList.remove('active');
        mobileNav.style.display = 'none';
        const spans = mobileMenu.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// Load featured products
async function loadFeaturedProducts() {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        query.limit(3); // Get only 3 products for featured
        query.descending('createdAt'); // Most recent first
        
        const results = await query.find();
        
        if (results.length === 0) {
            featuredProducts.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhum produto encontrado</p>';
            return;
        }

        featuredProducts.innerHTML = results.map(product => {
            const name = product.get('name') || 'Perfume AromaZ';
            const description = product.get('description') || 'Fragrância exclusiva';
            const price = product.get('price') || 199.90;
            const category = product.get('category') || 'exclusivo';
            const image = product.get('image') 
                ? product.get('image').url() 
                : `https://images.unsplash.com/photo-1592945403407-9c8b93047c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80`;

            return `
                <div class="product-card" onclick="window.location.href='pages/produtos.html?id=${product.id}'">
                    <div class="product-image" style="background-image: url('${image}')"></div>
                    <div class="product-info">
                        <div class="product-category">${category}</div>
                        <div class="product-name">${name}</div>
                        <div class="product-price">R$ ${price.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        featuredProducts.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e74c3c;">Erro ao carregar produtos</p>';
    }
}

// Newsletter form
newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector('input').value;
    
    // Here you can save to Parse if you want
    showToast('Obrigado por se inscrever!');
    newsletterForm.reset();
});

// Toast function
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--dark);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 2000;
        animation: slideIn 0.3s;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadFeaturedProducts();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});