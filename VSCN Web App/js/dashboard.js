// ==========================================================
// DASHBOARD FUNCTIONS
// ==========================================================

let monthlyChart = null;
let statusChart = null;

// ==========================================================
// LOAD DASHBOARD
// ==========================================================

async function loadDashboard() {
    try {
        // Load stats
        const stats = await API.getDashboardStats();
        updateStats(stats);
        
        // Load recent payments
        await loadRecentPayments();
        
        // Update charts
        updateCharts(stats);
        
        // Update customer badge
        document.getElementById('customerBadge').textContent = stats.totalCustomers || 0;
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Error loading dashboard: ' + error.message, 'error');
    }
}

// ==========================================================
// UPDATE STATS
// ==========================================================

function updateStats(stats) {
    document.getElementById('totalCustomers').textContent = stats.totalCustomers || 0;
    document.getElementById('todayCollection').textContent = `₹${(stats.todayCollection || 0).toFixed(2)}`;
    document.getElementById('todayCount').textContent = `${stats.todayCount || 0} payments`;
    document.getElementById('monthCollection').textContent = `₹${(stats.monthCollection || 0).toFixed(2)}`;
    document.getElementById('currentMonth').textContent = stats.currentMonth || 'Current Month';
    document.getElementById('pendingCount').textContent = stats.pendingCount || 0;
    document.getElementById('pendingAmount').textContent = `₹${(stats.pendingAmount || 0).toFixed(2)}`;
}

// ==========================================================
// LOAD RECENT PAYMENTS
// ==========================================================

async function loadRecentPayments() {
    const tbody = document.getElementById('recentPaymentsBody');
    
    try {
        const payments = await API.getPaymentHistory(10);
        
        if (!payments || payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        No recent payments found
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td><strong>${payment.receiptNo}</strong></td>
                <td>${payment.customerName}</td>
                <td><span class="badge">${payment.customerCode}</span></td>
                <td>${payment.month}</td>
                <td><strong>₹${payment.amount.toFixed(2)}</strong></td>
                <td><span class="status-badge ${payment.mode.toLowerCase()}">${payment.mode}</span></td>
                <td>${formatDate(payment.date)}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="viewReceipt('${payment.receiptNo}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Load recent payments error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    Error loading payments: ${error.message}
                </td>
            </tr>
        `;
    }
}

// ==========================================================
// UPDATE CHARTS
// ==========================================================

function updateCharts(stats) {
    updateMonthlyChart(stats);
    updateStatusChart(stats);
}

function updateMonthlyChart(stats) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    const months = stats.monthlyData?.map(d => d.month) || 
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = stats.monthlyData?.map(d => d.amount) || 
        Array(12).fill(0);
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Collection (₹)',
                data: data,
                backgroundColor: 'rgba(26, 60, 110, 0.7)',
                borderColor: '#1a3c6e',
                borderWidth: 2,
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '₹' + value.toLocaleString()
                    }
                }
            }
        }
    });
}

function updateStatusChart(stats) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    if (statusChart) {
        statusChart.destroy();
    }
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending', 'Partial'],
            datasets: [{
                data: [
                    stats.paidCount || 0,
                    stats.pendingCount || 0,
                    stats.partialCount || 0
                ],
                backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ==========================================================
// UTILITY FUNCTIONS
// ==========================================================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function viewReceipt(receiptNo) {
    window.open(`/receipt.html?id=${receiptNo}`, '_blank');
}

function scanQR() {
    // Implement QR scan
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        showToast('QR Scanner opening...', 'info');
        // Redirect to QR scan page or use library
        window.location.href = '/scan.html';
    } else {
        showToast('Camera not available', 'error');
    }
}