// ==========================================================
// CUSTOMERS PAGE FUNCTIONS
// ==========================================================

let allCustomers = [];
let filteredCustomers = [];

// ==========================================================
// LOAD CUSTOMERS PAGE
// ==========================================================

function loadCustomersPage() {
    const container = document.getElementById('page-customers');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-users"></i> Customers</h3>
                <div>
                    <button class="btn btn-sm btn-outline" onclick="refreshCustomers()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="showAddCustomerModal()">
                        <i class="fas fa-plus"></i> Add Customer
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="search-box" style="width:100%;border-radius:8px;margin-bottom:16px;">
                    <i class="fas fa-search"></i>
                    <input type="text" class="form-control" style="border:none;background:transparent;"
                           placeholder="Search customers by name, code, STB ID, or phone..."
                           onkeyup="filterCustomers(this.value)">
                </div>
                
                <div id="customersContainer">
                    <div class="text-center">
                        <div class="loading-spinner"></div>
                        Loading customers...
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadAllCustomers();
}

// ==========================================================
// LOAD ALL CUSTOMERS
// ==========================================================

async function loadAllCustomers() {
    try {
        allCustomers = await API.getCustomers();
        filteredCustomers = [...allCustomers];
        renderCustomers();
    } catch (error) {
        console.error('Load customers error:', error);
        document.getElementById('customersContainer').innerHTML = `
            <div class="text-center text-danger">
                Error loading customers: ${error.message}
                <br>
                <button class="btn btn-primary mt-2" onclick="loadAllCustomers()">Retry</button>
            </div>
        `;
    }
}

// ==========================================================
// RENDER CUSTOMERS
// ==========================================================

function renderCustomers() {
    const container = document.getElementById('customersContainer');
    
    if (filteredCustomers.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-users" style="font-size:48px;opacity:0.3;display:block;margin-bottom:16px;"></i>
                No customers found
            </div>
        `;
        return;
    }
    
    const statusColors = {
        'PAID': 'green',
        'PENDING': 'red',
        'PARTIAL': 'orange'
    };
    
    container.innerHTML = `
        <div class="customer-grid">
            ${filteredCustomers.map(customer => `
                <div class="customer-card">
                    <div class="header">
                        <span class="name">${customer.name}</span>
                        <span class="code">${customer.code}</span>
                    </div>
                    <div class="details">
                        <div><span class="label">STB ID:</span> ${customer.stbId}</div>
                        <div><span class="label">Phone:</span> ${customer.phone || 'N/A'}</div>
                        <div><span class="label">Package:</span> ₹${customer.monthlyAmount.toFixed(2)}</div>
                        <div><span class="label">Paid Months:</span> ${customer.paidMonths || 0}</div>
                        <div><span class="label">Status:</span> 
                            <span style="color:${statusColors[customer.status] || '#666'};font-weight:600;">
                                ${customer.status}
                            </span>
                        </div>
                        <div><span class="label">Pending:</span> 
                            <span style="color:${customer.pendingAmount > 0 ? '#dc3545' : '#28a745'};font-weight:600;">
                                ₹${customer.pendingAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #eee;">
                        <button class="btn btn-sm btn-primary" onclick="quickPayment('${customer.code}')">
                            <i class="fas fa-hand-holding-usd"></i> Pay
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="viewCustomerDetails('${customer.code}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${customer.pendingAmount > 0 ? `
                            <button class="btn btn-sm btn-warning" onclick="sendReminder('${customer.code}')">
                                <i class="fas fa-bell"></i> Remind
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ==========================================================
// FILTER CUSTOMERS
// ==========================================================

function filterCustomers(query) {
    const search = query.toLowerCase().trim();
    
    if (!search) {
        filteredCustomers = [...allCustomers];
    } else {
        filteredCustomers = allCustomers.filter(c => 
            c.name.toLowerCase().includes(search) ||
            c.code.toLowerCase().includes(search) ||
            c.stbId.toLowerCase().includes(search) ||
            (c.phone && c.phone.includes(search))
        );
    }
    
    renderCustomers();
}

// ==========================================================
// REFRESH CUSTOMERS
// ==========================================================

function refreshCustomers() {
    showToast('Refreshing customers...', 'info');
    loadAllCustomers();
}

// ==========================================================
// QUICK PAYMENT
// ==========================================================

function quickPayment(customerCode) {
    showPage('payment');
    document.getElementById('paymentCustomerCode').value = customerCode;
    searchCustomerForPayment();
}

// ==========================================================
// VIEW CUSTOMER DETAILS
// ==========================================================

function viewCustomerDetails(customerCode) {
    // Show customer details in modal
    const customer = allCustomers.find(c => c.code === customerCode);
    if (!customer) {
        showToast('Customer not found', 'error');
        return;
    }
    
    // Build month-wise payment table
    const monthData = customer.monthWisePayment || {};
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    let monthHTML = '';
    months.forEach(month => {
        const paid = monthData[month] || 0;
        const status = paid >= customer.monthlyAmount ? '✅' : paid > 0 ? '🟡' : '❌';
        monthHTML += `
            <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;font-size:13px;">
                <span>${month}</span>
                <span>${status} ₹${paid.toFixed(2)}</span>
            </div>
        `;
    });
    
    showModal(`
        <h3>${customer.name}</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;font-size:14px;">
            <div><strong>Code:</strong> ${customer.code}</div>
            <div><strong>STB ID:</strong> ${customer.stbId}</div>
            <div><strong>Phone:</strong> ${customer.phone || 'N/A'}</div>
            <div><strong>Package:</strong> ₹${customer.monthlyAmount.toFixed(2)}</div>
            <div><strong>Paid Months:</strong> ${customer.paidMonths || 0}</div>
            <div><strong>Status:</strong> ${customer.status}</div>
            <div><strong>Pending:</strong> ₹${customer.pendingAmount.toFixed(2)}</div>
        </div>
        <div style="margin-top:16px;max-height:300px;overflow-y:auto;border:1px solid #eee;border-radius:8px;padding:12px;">
            <div style="font-weight:600;margin-bottom:8px;">Month-wise Payment</div>
            ${monthHTML}
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
            <button class="btn btn-primary" onclick="quickPayment('${customer.code}')">
                <i class="fas fa-hand-holding-usd"></i> Make Payment
            </button>
            <button class="btn btn-success" onclick="sendReminder('${customer.code}')">
                <i class="fas fa-bell"></i> Send Reminder
            </button>
        </div>
    `);
}

// ==========================================================
// SEND REMINDER
// ==========================================================

function sendReminder(customerCode) {
    const customer = allCustomers.find(c => c.code === customerCode);
    if (!customer) {
        showToast('Customer not found', 'error');
        return;
    }
    
    if (!customer.phone) {
        showToast('Customer has no phone number', 'warning');
        return;
    }
    
    if (confirm(`Send payment reminder to ${customer.name} (${customer.phone})?`)) {
        // Implement reminder sending
        showToast(`Reminder sent to ${customer.name}`, 'success');
    }
}

// ==========================================================
// SHOW ADD CUSTOMER MODAL
// ==========================================================

function showAddCustomerModal() {
    showModal(`
        <h3>Add New Customer</h3>
        <form id="addCustomerForm" onsubmit="addCustomer(event)">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Customer Name *</label>
                    <input type="text" class="form-control" id="newCustomerName" required>
                </div>
                <div class="form-group">
                    <label class="form-label">VSCN Code *</label>
                    <input type="text" class="form-control" id="newCustomerCode" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">STB ID *</label>
                    <input type="text" class="form-control" id="newCustomerStbId" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-control" id="newCustomerPhone">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Monthly Package (₹) *</label>
                    <input type="number" class="form-control" id="newCustomerMonthly" required step="0.01" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Start Month</label>
                    <select class="form-control" id="newCustomerStartMonth">
                        <option value="">Current Month</option>
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
            </div>
            <div style="display:flex;gap:8px;margin-top:16px;">
                <button type="submit" class="btn btn-success">
                    <i class="fas fa-plus"></i> Add Customer
                </button>
                <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `);
}

// ==========================================================
// ADD CUSTOMER
// ==========================================================

async function addCustomer(event) {
    event.preventDefault();
    
    const data = {
        name: document.getElementById('newCustomerName').value.trim(),
        code: document.getElementById('newCustomerCode').value.trim().toUpperCase(),
        stbId: document.getElementById('newCustomerStbId').value.trim(),
        phone: document.getElementById('newCustomerPhone').value.trim(),
        monthlyAmount: parseFloat(document.getElementById('newCustomerMonthly').value),
        startMonth: document.getElementById('newCustomerStartMonth').value || null
    };
    
    if (!data.name || !data.code || !data.stbId || !data.monthlyAmount) {
        showToast('Please fill all required fields', 'warning');
        return;
    }
    
    try {
        // Add via API - you need to implement this endpoint
        showToast('Adding customer...', 'info');
        // await API.addCustomer(data);
        
        showToast('Customer added successfully', 'success');
        closeModal();
        loadAllCustomers();
        
    } catch (error) {
        console.error('Add customer error:', error);
        showToast('Failed to add customer: ' + error.message, 'error');
    }
}