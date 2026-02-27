// Initialize Parse
Parse.initialize(
    "KNpEdabAChZyTRn4higQ8dqzEQd88QjmZjswS59n",
    "1jRsUjRZmYww95gs5xmK7CC2iR39KowNyvmkfFLw"
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// Cart state
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const navbar = document.querySelector('.navbar');
const mobileMenu = document.getElementById('mobileMenu');
const mobileNav = document.getElementById('mobileNav');
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

// Newsletter form
newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector('input').value;
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

// Animate stats on scroll
const stats = document.querySelectorAll('.stat-number');
let animated = false;

function animateStats() {
    if (animated) return;
    
    stats.forEach(stat => {
        const target = parseInt(stat.textContent);
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target + (stat.textContent.includes('+') ? '+' : '');
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current) + (stat.textContent.includes('+') ? '+' : '');
            }
        }, 20);
    });
    
    animated = true;
}

// Intersection Observer for stats
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
        }
    });
}, { threshold: 0.5 });

const historySection = document.querySelector('.history');
if (historySection) {
    observer.observe(historySection);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
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

// Ativar link da navbar conforme a página atual
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === 'sobre.html' && href === 'sobre.html')) {
            link.classList.add('active');
        }
    });
});