// ==========================================================
// VSCN BILLING SYSTEM - MAIN APP
// ==========================================================

// ==========================================================
// PAGE MANAGEMENT
// ==========================================================

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const page = document.getElementById(`page-${pageName}`);
    if (page) {
        page.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item a').forEach(link => {
        if (link.getAttribute('href') === `#${pageName}`) {
            link.parentElement.classList.add('active');
        }
    });
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        customers: 'Customers',
        payment: 'Payment',
        reports: 'Reports',
        receipts: 'Receipts',
        settings: 'Settings'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName] || pageName;
    document.getElementById('breadcrumbCurrent').textContent = titles[pageName] || pageName;
    
    // Load page content
    switch(pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'customers':
            loadCustomersPage();
            break;
        case 'payment':
            loadPaymentPage();
            break;
        case 'reports':
            loadReportsPage();
            break;
        case 'receipts':
            loadReceiptsPage();
            break;
        case 'settings':
            loadSettingsPage();
            break;
    }
}

// ==========================================================
// SIDEBAR TOGGLE
// ==========================================================

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Close sidebar on mobile when clicking outside
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const isSidebarClick = sidebar.contains(e.target);
    const isToggleClick = e.target.closest('.sidebar-toggle');
    
    if (window.innerWidth <= 992 && !isSidebarClick && !isToggleClick) {
        sidebar.classList.remove('open');
    }
});

// ==========================================================
// THEME TOGGLE
// ==========================================================

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('themeIcon');
    const isDark = document.body.classList.contains('dark-mode');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('themeIcon').className = 'fas fa-sun';
}

// ==========================================================
// GLOBAL SEARCH
// ==========================================================

function globalSearch(query) {
    if (query.length < 2) {
        document.getElementById('customerSearchResults')?.remove();
        return;
    }
    
    // Show search results dropdown
    const searchBox = document.querySelector('.search-box');
    const existingResults = document.getElementById('customerSearchResults');
    
    if (existingResults) {
        existingResults.remove();
    }
    
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'customerSearchResults';
    resultsDiv.className = 'search-results-dropdown';
    resultsDiv.style.cssText = `
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        min-width: 300px;
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
    `;
    
    searchBox.style.position = 'relative';
    searchBox.appendChild(resultsDiv);
    
    // Search API
    API.searchCustomer(query)
        .then(customer => {
            if (customer) {
                resultsDiv.innerHTML = `
                    <div class="search-result-item" onclick="selectSearchResult('${customer.code}')">
                        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #eee;">
                            <div style="width:36px;height:36px;border-radius:50%;background:#e3f2fd;display:flex;align-items:center;justify-content:center;color:#1976d2;font-weight:600;">
                                ${customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style="font-weight:500;">${customer.name}</div>
                                <div style="font-size:12px;color:#666;">${customer.code} • ${customer.stbId}</div>
                            </div>
                            <div style="margin-left:auto;font-size:12px;color:#666;">₹${customer.monthlyAmount}</div>
                        </div>
                    </div>
                `;
                resultsDiv.style.display = 'block';
            } else {
                resultsDiv.innerHTML = `
                    <div style="padding:12px 16px;color:#999;text-align:center;">
                        No customer found
                    </div>
                `;
                resultsDiv.style.display = 'block';
            }
        })
        .catch(() => {
            resultsDiv.innerHTML = `
                <div style="padding:12px 16px;color:#dc3545;text-align:center;">
                    Error searching customer
                </div>
            `;
            resultsDiv.style.display = 'block';
        });
}

function selectSearchResult(code) {
    document.getElementById('customerSearchResults').style.display = 'none';
    showPage('payment');
    document.getElementById('paymentCustomerCode').value = code;
    searchCustomerForPayment();
}

// Close search results on click outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-box')) {
        const results = document.getElementById('customerSearchResults');
        if (results) {
            results.style.display = 'none';
        }
    }
});

// ==========================================================
// REFRESH ALL
// ==========================================================

function refreshAll() {
    showToast('Refreshing data...', 'info');
    loadDashboard();
}

// ==========================================================
// NOTIFICATIONS
// ==========================================================

function toggleNotifications() {
    // Implement notifications toggle
    showToast('Notifications feature coming soon', 'info');
}

// ==========================================================
// LOGOUT
// ==========================================================

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        API.logout();
        window.location.href = '/login.html';
    }
}

// ==========================================================
// INITIALIZATION
// ==========================================================

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const user = API.getUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    // Set user info
    document.getElementById('userName').textContent = user.name || 'Administrator';
    document.getElementById('userRole').textContent = user.role || 'ADMIN';
    
    // Load dashboard by default
    showPage('dashboard');
    
    // Auto-refresh every 60 seconds
    setInterval(() => {
        if (document.querySelector('#page-dashboard.active')) {
            loadDashboard();
        }
    }, 60000);
});