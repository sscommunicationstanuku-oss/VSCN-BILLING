// ==========================================================
// DATA SYNC SERVICE - CONNECTS TO GOOGLE SHEETS API
// ==========================================================

class DataSyncService {
    constructor() {
        // Your Google Apps Script Web App URL
        this.API_URL = 'https://script.google.com/macros/library/d/1CI8XTx0_zmVMAmU2D5AFumXBQsdVuYJiexjzBKSzk4ZNNm_Wv-tSwNs9/195';
        this.lastSync = null;
        this.syncInterval = null;
        this.isSyncing = false;
    }

    // ==========================================================
    // GENERIC API CALL
    // ==========================================================

    async callAPI(action, params = {}) {
        try {
            const url = new URL(this.API_URL);
            url.searchParams.append('action', action);
            
            // Add parameters
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('API Call Error:', error);
            throw error;
        }
    }

    // ==========================================================
    // SYNC CUSTOMERS
    // ==========================================================

    async syncCustomers() {
        if (this.isSyncing) {
            console.log('Sync already in progress...');
            return;
        }
        
        this.isSyncing = true;
        this.showSyncStatus('Syncing customers...', 'loading');
        
        try {
            const result = await this.callAPI('getCustomers');
            
            if (result.success) {
                // Save to localStorage
                localStorage.setItem('vscn_customers', JSON.stringify(result.data));
                localStorage.setItem('vscn_customers_last_sync', result.timestamp);
                localStorage.setItem('vscn_customers_total', result.total);
                
                this.lastSync = new Date(result.timestamp);
                this.showSyncStatus(`Synced ${result.total} customers`, 'success');
                
                // Dispatch event for UI update
                window.dispatchEvent(new CustomEvent('customersSynced', {
                    detail: { customers: result.data, total: result.total }
                }));
                
                return result.data;
            } else {
                throw new Error(result.message || 'Sync failed');
            }
            
        } catch (error) {
            console.error('Sync error:', error);
            this.showSyncStatus('Sync failed: ' + error.message, 'error');
            
            // Try to load cached data
            const cached = localStorage.getItem('vscn_customers');
            if (cached) {
                const customers = JSON.parse(cached);
                this.showSyncStatus(`Using cached data (${customers.length} customers)`, 'warning');
                return customers;
            }
            
            throw error;
            
        } finally {
            this.isSyncing = false;
        }
    }

    // ==========================================================
    // SYNC PAYMENTS
    // ==========================================================

    async syncPayments(limit = 50) {
        try {
            const result = await this.callAPI('getPayments', { limit: limit });
            
            if (result.success) {
                localStorage.setItem('vscn_payments', JSON.stringify(result.data));
                localStorage.setItem('vscn_payments_last_sync', new Date().toISOString());
                return result.data;
            } else {
                throw new Error(result.message || 'Sync failed');
            }
            
        } catch (error) {
            console.error('Payments sync error:', error);
            const cached = localStorage.getItem('vscn_payments');
            if (cached) {
                return JSON.parse(cached);
            }
            throw error;
        }
    }

    // ==========================================================
    // SYNC STATS
    // ==========================================================

    async syncStats() {
        try {
            const result = await this.callAPI('getStats');
            
            if (result.success) {
                localStorage.setItem('vscn_stats', JSON.stringify(result.data));
                localStorage.setItem('vscn_stats_last_sync', new Date().toISOString());
                return result.data;
            } else {
                throw new Error(result.message || 'Sync failed');
            }
            
        } catch (error) {
            console.error('Stats sync error:', error);
            const cached = localStorage.getItem('vscn_stats');
            if (cached) {
                return JSON.parse(cached);
            }
            throw error;
        }
    }

    // ==========================================================
    // GET CACHED DATA
    // ==========================================================

    getCachedCustomers() {
        const cached = localStorage.getItem('vscn_customers');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    getCachedPayments() {
        const cached = localStorage.getItem('vscn_payments');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    getCachedStats() {
        const cached = localStorage.getItem('vscn_stats');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    getLastSyncTime() {
        return localStorage.getItem('vscn_customers_last_sync');
    }

    // ==========================================================
    // AUTO SYNC
    // ==========================================================

    startAutoSync(intervalMinutes = 5) {
        // Stop existing interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Initial sync
        this.syncAll();
        
        // Schedule periodic sync
        this.syncInterval = setInterval(() => {
            this.syncAll();
        }, intervalMinutes * 60 * 1000);
        
        console.log(`Auto-sync started (every ${intervalMinutes} minutes)`);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async syncAll() {
        try {
            await Promise.all([
                this.syncCustomers(),
                this.syncPayments(20),
                this.syncStats()
            ]);
            
            // Update UI
            this.updateUI();
            
        } catch (error) {
            console.error('Full sync error:', error);
        }
    }

    // ==========================================================
    // UI HELPERS
    // ==========================================================

    showSyncStatus(message, type = 'info') {
        // Show status in UI
        const statusEl = document.getElementById('syncStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `sync-status ${type}`;
        }
        
        // Also show toast notification
        if (window.showToast) {
            const icon = {
                'loading': '🔄',
                'success': '✅',
                'error': '❌',
                'warning': '⚠️'
            };
            showToast(`${icon[type] || 'ℹ️'} ${message}`, type);
        }
    }

    updateUI() {
        // Update dashboard stats
        const stats = this.getCachedStats();
        if (document.getElementById('totalCustomers')) {
            document.getElementById('totalCustomers').textContent = stats.totalCustomers || 0;
        }
        
        // Update customer count badge
        const customers = this.getCachedCustomers();
        if (document.getElementById('customerBadge')) {
            document.getElementById('customerBadge').textContent = customers.length;
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('dataUpdated', {
            detail: {
                stats: stats,
                customers: customers
            }
        }));
    }

    // ==========================================================
    // SEARCH CUSTOMER
    // ==========================================================

    searchCustomer(query) {
        const customers = this.getCachedCustomers();
        const search = query.toLowerCase().trim();
        
        if (!search) return customers;
        
        return customers.filter(c => 
            c.name.toLowerCase().includes(search) ||
            c.code.toLowerCase().includes(search) ||
            c.stbId.toLowerCase().includes(search) ||
            (c.phone && c.phone.includes(search))
        );
    }

    // ==========================================================
    // GET CUSTOMER BY CODE
    // ==========================================================

    getCustomerByCode(code) {
        const customers = this.getCachedCustomers();
        return customers.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
    }
}

// ==========================================================
// EXPORT FOR USE
// ==========================================================

// Create global instance
const dataSync = new DataSyncService();

// Auto-sync on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we have cached data
    const customers = dataSync.getCachedCustomers();
    const stats = dataSync.getCachedStats();
    
    if (customers.length > 0) {
        dataSync.updateUI();
        // Silent background sync
        setTimeout(() => {
            dataSync.syncAll().catch(() => {});
        }, 3000);
    } else {
        // Initial sync
        dataSync.syncAll().catch(() => {});
    }
});

// ==========================================================
// MANUAL SYNC FUNCTION
// ==========================================================

function manualSync() {
    dataSync.syncAll().then(() => {
        showToast('Data synced successfully!', 'success');
    }).catch((error) => {
        showToast('Sync failed: ' + error.message, 'error');
    });
}
