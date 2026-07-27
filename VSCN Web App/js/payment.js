// ==========================================================
// PAYMENT PAGE FUNCTIONS
// ==========================================================

let selectedCustomer = null;

// ==========================================================
// LOAD PAYMENT PAGE
// ==========================================================

function loadPaymentPage() {
    const container = document.getElementById('page-payment');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-hand-holding-usd"></i> Process Payment</h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-lg-4">
                        <!-- Customer Search -->
                        <div class="form-group">
                            <label class="form-label">Customer Code / Name</label>
                            <div class="search-box" style="width:100%;border-radius:8px;">
                                <i class="fas fa-search"></i>
                                <input type="text" id="paymentCustomerCode" 
                                       class="form-control" style="border:none;background:transparent;"
                                       placeholder="Enter VSCN code..." 
                                       onkeyup="searchCustomerForPayment()">
                            </div>
                        </div>
                        
                        <!-- Customer Details -->
                        <div id="customerDetails" style="display:none;">
                            <div class="customer-info-box" style="background:#f8f9fa;padding:16px;border-radius:8px;margin-top:12px;">
                                <div class="flex-between">
                                    <div>
                                        <div style="font-weight:600;font-size:18px;" id="custName">-</div>
                                        <div style="font-size:13px;color:#666;" id="custCode">-</div>
                                    </div>
                                    <div style="text-align:right;">
                                        <div style="font-size:12px;color:#666;">Monthly Package</div>
                                        <div style="font-weight:600;font-size:18px;color:#1a3c6e;" id="custMonthly">₹0</div>
                                    </div>
                                </div>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;font-size:13px;">
                                    <div><span style="color:#666;">STB ID:</span> <span id="custStbId">-</span></div>
                                    <div><span style="color:#666;">Phone:</span> <span id="custPhone">-</span></div>
                                    <div><span style="color:#666;">Paid Months:</span> <span id="custPaidMonths">0</span></div>
                                    <div><span style="color:#666;">Status:</span> <span id="custStatus">-</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-8">
                        <!-- Payment Form -->
                        <div id="paymentForm" style="display:none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Select Month *</label>
                                    <select class="form-control" id="paymentMonth">
                                        <option value="">Select Month</option>
                                        <option value="JANUARY">January</option>
                                        <option value="FEBRUARY">February</option>
                                        <option value="MARCH">March</option>
                                        <option value="APRIL">April</option>
                                        <option value="MAY">May</option>
                                        <option value="JUNE">June</option>
                                        <option value="JULY">July</option>
                                        <option value="AUGUST">August</option>
                                        <option value="SEPTEMBER">September</option>
                                        <option value="OCTOBER">October</option>
                                        <option value="NOVEMBER">November</option>
                                        <option value="DECEMBER">December</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Amount (₹) *</label>
                                    <input type="number" class="form-control" id="paymentAmount" 
                                           placeholder="Enter amount" step="0.01" min="1">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Payment Mode *</label>
                                    <select class="form-control" id="paymentMode">
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="BANK TRANSFER">Bank Transfer</option>
                                        <option value="CARD">Card</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Receipt Number (Optional)</label>
                                    <input type="text" class="form-control" id="paymentReceipt" 
                                           placeholder="Leave empty for auto-generate">
                                </div>
                            </div>
                            
                            <div style="display:flex;gap:12px;margin-top:16px;">
                                <button class="btn btn-success" onclick="processPayment()">
                                    <i class="fas fa-check"></i> Process Payment
                                </button>
                                <button class="btn btn-danger" onclick="clearPaymentForm()">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Payment History -->
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-history"></i> Payment History</h3>
                <button class="btn btn-sm btn-outline" onclick="loadPaymentHistory()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            <div class="card-body" style="padding:0;">
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Receipt</th>
                                <th>Customer</th>
                                <th>Code</th>
                                <th>Month</th>
                                <th>Amount</th>
                                <th>Mode</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="paymentHistoryBody">
                            <tr>
                                <td colspan="8" class="text-center">
                                    <div class="loading-spinner"></div>
                                    Loading...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    loadPaymentHistory();
}

// ==========================================================
// SEARCH CUSTOMER FOR PAYMENT
// ==========================================================

let customerSearchTimeout = null;

function searchCustomerForPayment() {
    const query = document.getElementById('paymentCustomerCode').value.trim();
    
    if (customerSearchTimeout) {
        clearTimeout(customerSearchTimeout);
    }
    
    if (query.length < 2) {
        document.getElementById('customerDetails').style.display = 'none';
        document.getElementById('paymentForm').style.display = 'none';
        return;
    }
    
    customerSearchTimeout = setTimeout(async () => {
        try {
            showToast('Searching customer...', 'info');
            const customer = await API.searchCustomer(query);
            selectedCustomer = customer;
            
            // Show customer details
            document.getElementById('custName').textContent = customer.name;
            document.getElementById('custCode').textContent = customer.code;
            document.getElementById('custStbId').textContent = customer.stbId;
            document.getElementById('custPhone').textContent = customer.phone || 'N/A';
            document.getElementById('custMonthly').textContent = `₹${customer.monthlyAmount.toFixed(2)}`;
            document.getElementById('custPaidMonths').textContent = customer.paidMonths || 0;
            
            const statusColors = {
                'PAID': 'green',
                'PENDING': 'red',
                'PARTIAL': 'orange'
            };
            document.getElementById('custStatus').innerHTML = 
                `<span style="color:${statusColors[customer.status] || '#666'};font-weight:600;">${customer.status}</span>`;
            
            document.getElementById('customerDetails').style.display = 'block';
            document.getElementById('paymentForm').style.display = 'block';
            
            // Set default amount
            const pending = customer.pendingAmount || 0;
            document.getElementById('paymentAmount').value = pending > 0 ? pending : customer.monthlyAmount;
            
            showToast(`Customer found: ${customer.name}`, 'success');
            
        } catch (error) {
            console.error('Search error:', error);
            document.getElementById('customerDetails').style.display = 'none';
            document.getElementById('paymentForm').style.display = 'none';
            showToast('Customer not found', 'error');
        }
    }, 500);
}

// ==========================================================
// PROCESS PAYMENT
// ==========================================================

async function processPayment() {
    if (!selectedCustomer) {
        showToast('Please search and select a customer first', 'warning');
        return;
    }
    
    const month = document.getElementById('paymentMonth').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const mode = document.getElementById('paymentMode').value;
    const receiptNo = document.getElementById('paymentReceipt').value.trim();
    
    // Validation
    if (!month) {
        showToast('Please select a month', 'warning');
        return;
    }
    
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'warning');
        return;
    }
    
    if (amount > selectedCustomer.monthlyAmount * 12) {
        showToast('Amount exceeds maximum limit', 'warning');
        return;
    }
    
    // Confirmation
    const confirmMsg = `
        Confirm Payment
        Customer: ${selectedCustomer.name}
        Code: ${selectedCustomer.code}
        Month: ${month}
        Amount: ₹${amount.toFixed(2)}
        Mode: ${mode}
        Receipt: ${receiptNo || 'Auto-generated'}
    `;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        const result = await API.processPayment({
            customerCode: selectedCustomer.code,
            amount: amount,
            month: month,
            mode: mode,
            receiptNo: receiptNo
        });
        
        // Show success animation
        showPaymentSuccess(result);
        
        // Reset form
        clearPaymentForm();
        
        // Refresh data
        loadDashboard();
        loadPaymentHistory();
        
        showToast(`Payment successful! Receipt: ${result.receiptNo}`, 'success');
        
    } catch (error) {
        console.error('Payment error:', error);
        showToast('Payment failed: ' + error.message, 'error');
    }
}

// ==========================================================
// SHOW PAYMENT SUCCESS
// ==========================================================

function showPaymentSuccess(payment) {
    const overlay = document.createElement('div');
    overlay.className = 'payment-success show';
    overlay.innerHTML = `
        <div class="icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <h2>Payment Successful!</h2>
        <p>Receipt No: <strong>${payment.receiptNo}</strong></p>
        <p style="margin-top:4px;">Amount: ₹${payment.amount.toFixed(2)}</p>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px;">
            <button class="btn btn-primary" onclick="viewReceipt('${payment.receiptNo}')">
                <i class="fas fa-receipt"></i> View Receipt
            </button>
            <button class="btn btn-success" onclick="shareReceipt('${payment.receiptNo}')">
                <i class="fas fa-share"></i> Share
            </button>
            <button class="btn btn-outline" onclick="this.closest('.payment-success').remove()">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.remove();
        }
    }, 10000);
}

// ==========================================================
// CLEAR PAYMENT FORM
// ==========================================================

function clearPaymentForm() {
    document.getElementById('paymentCustomerCode').value = '';
    document.getElementById('paymentMonth').value = '';
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentReceipt').value = '';
    document.getElementById('customerDetails').style.display = 'none';
    document.getElementById('paymentForm').style.display = 'none';
    selectedCustomer = null;
}

// ==========================================================
// LOAD PAYMENT HISTORY
// ==========================================================

async function loadPaymentHistory() {
    const tbody = document.getElementById('paymentHistoryBody');
    
    try {
        const payments = await API.getPaymentHistory(20);
        
        if (!payments || payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        No payment history found
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
                    <button class="btn btn-sm btn-danger" onclick="cancelPayment('${payment.customerCode}')" style="margin-top:4px;">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Load payment history error:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    Error loading payment history: ${error.message}
                </td>
            </tr>
        `;
    }
}

// ==========================================================
// CANCEL PAYMENT
// ==========================================================

async function cancelPayment(customerCode) {
    if (!confirm(`Are you sure you want to cancel the last payment for ${customerCode}?`)) {
        return;
    }
    
    try {
        const result = await API.cancelPayment(customerCode);
        showToast('Payment cancelled successfully', 'success');
        loadPaymentHistory();
        loadDashboard();
    } catch (error) {
        console.error('Cancel payment error:', error);
        showToast('Failed to cancel payment: ' + error.message, 'error');
    }
}

// ==========================================================
// SHARE RECEIPT
// ==========================================================

function shareReceipt(receiptNo) {
    const url = `${window.location.origin}/receipt.html?id=${receiptNo}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Payment Receipt',
            text: `VSCN Payment Receipt: ${receiptNo}`,
            url: url
        }).catch(() => {});
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showToast('Receipt link copied to clipboard', 'success');
        }).catch(() => {
            // Manual copy
            prompt('Copy this URL:', url);
        });
    }
}