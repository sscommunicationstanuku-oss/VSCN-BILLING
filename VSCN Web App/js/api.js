// ==========================================================
// VSCN BILLING SYSTEM - API SERVICE
// ==========================================================

const API = {
    // Base URL - Update with your deployment
    baseUrl: 'https://script.google.com/macros/s/AKfycbwAMfU_6w-4Rh-ubKH6oi6ISKiPzZQvhF8sASskduPv998LksCFPXsINw942Hl__4lmhg/exec',
    
    // Auth Token
    token: localStorage.getItem('auth_token') || null,
    
    // Headers
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    },

    // Generic request method
    async request(endpoint, method = 'POST', data = null) {
        try {
            const options = {
                method: method,
                headers: this.getHeaders(),
                muteHttpExceptions: true
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(this.baseUrl + endpoint, options);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Request failed');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // ==========================================================
    // AUTH METHODS
    // ==========================================================

    async login(username, password) {
        const result = await this.request('/login', 'POST', { username, password });
        if (result.data && result.data.token) {
            this.token = result.data.token;
            localStorage.setItem('auth_token', result.data.token);
            localStorage.setItem('user_data', JSON.stringify(result.data.user));
        }
        return result.data;
    },

    async logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    },

    getUser() {
        const data = localStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    },

    // ==========================================================
    // CUSTOMER METHODS
    // ==========================================================

    async getCustomers() {
        const result = await this.request('/getCustomers', 'GET');
        return result.data || [];
    },

    async searchCustomer(query) {
        const result = await this.request('/searchCustomer', 'POST', { searchText: query });
        return result.data;
    },

    // ==========================================================
    // PAYMENT METHODS
    // ==========================================================

    async processPayment(data) {
        const result = await this.request('/processPayment', 'POST', data);
        return result.data;
    },

    async cancelPayment(customerCode) {
        const result = await this.request('/cancelPayment', 'POST', { customerCode });
        return result.success;
    },

    async getPaymentHistory(limit = 20) {
        const result = await this.request('/getPaymentHistory', 'POST', { limit });
        return result.data || [];
    },

    // ==========================================================
    // REPORT METHODS
    // ==========================================================

    async getMonthlyReport(month) {
        const result = await this.request('/getReports', 'POST', { 
            type: 'monthly', 
            month 
        });
        return result.data;
    },

    async getDateRangeReport(startDate, endDate) {
        const result = await this.request('/getReports', 'POST', {
            type: 'dateRange',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        return result.data;
    },

    async getDueReport(type = '15day') {
        const result = await this.request('/getReports', 'POST', { type });
        return result.data;
    },

    async getDashboardStats() {
        const result = await this.request('/getDashboardStats', 'GET');
        return result.data;
    },

    // ==========================================================
    // EXPORT METHODS
    // ==========================================================

    async exportData(type = 'all') {
        const result = await this.request('/exportData', 'POST', { type });
        return result.data;
    },

    // ==========================================================
    // RECEIPT METHODS
    // ==========================================================

    async generateReceipt(receiptNo) {
        const result = await this.request('/generateReceipt', 'POST', { receiptNo });
        return result.data;
    }
};

// ==========================================================
// TOAST NOTIFICATIONS
// ==========================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toastContainer';
    document.body.appendChild(container);
    return container;
}
