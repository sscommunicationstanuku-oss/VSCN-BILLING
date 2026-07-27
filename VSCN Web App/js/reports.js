// ==========================================================
// REPORTS PAGE FUNCTIONS
// ==========================================================

let currentReportData = null;

// ==========================================================
// LOAD REPORTS PAGE
// ==========================================================

function loadReportsPage() {
    const container = document.getElementById('page-reports');
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-chart-bar"></i> Generate Reports</h3>
            </div>
            <div class="card-body">
                <div class="report-filters">
                    <div class="form-group">
                        <label class="form-label">Report Type</label>
                        <select class="form-control" id="reportType" onchange="toggleReportFilters()">
                            <option value="monthly">Monthly Report</option>
                            <option value="15day">15-Day Due Report</option>
                            <option value="5day">5-Day Due Report</option>
                            <option value="dateRange">Date Range Report</option>
                            <option value="empty">Empty Received Date Report</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="reportMonthGroup">
                        <label class="form-label">Month</label>
                        <select class="form-control" id="reportMonth">
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
                    
                    <div class="form-group" id="reportDateRangeGroup" style="display:none;">
                        <label class="form-label">Start Date</label>
                        <input type="date" class="form-control" id="reportStartDate">
                    </div>
                    
                    <div class="form-group" id="reportDateRangeEndGroup" style="display:none;">
                        <label class="form-label">End Date</label>
                        <input type="date" class="form-control" id="reportEndDate">
                    </div>
                    
                    <div class="form-group" style="display:flex;align-items:flex-end;">
                        <button class="btn btn-primary" onclick="generateReport()">
                            <i class="fas fa-file-alt"></i> Generate Report
                        </button>
                        <button class="btn btn-success" onclick="exportReport()" style="margin-left:8px;">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Report Results -->
        <div id="reportResults" style="display:none;">
            <div class="card">
                <div class="card-header">
                    <h3 id="reportTitle">Report Results</h3>
                    <span id="reportMeta"></span>
                </div>
                <div class="card-body">
                    <!-- Summary -->
                    <div id="reportSummary" class="report-summary" style="background:#f8f9fa;padding:16px;border-radius:8px;margin-bottom:16px;">
                    </div>
                    
                    <!-- Details Table -->
                    <div class="table-responsive">
                        <table class="table" id="reportTable">
                            <thead id="reportTableHead">
                            </thead>
                            <tbody id="reportTableBody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================
// TOGGLE REPORT FILTERS
// ==========================================================

function toggleReportFilters() {
    const type = document.getElementById('reportType').value;
    
    document.getElementById('reportMonthGroup').style.display = type === 'monthly' ? 'block' : 'none';
    document.getElementById('reportDateRangeGroup').style.display = type === 'dateRange' ? 'block' : 'none';
    document.getElementById('reportDateRangeEndGroup').style.display = type === 'dateRange' ? 'block' : 'none';
}

// ==========================================================
// GENERATE REPORT
// ==========================================================

async function generateReport() {
    const type = document.getElementById('reportType').value;
    const reportResults = document.getElementById('reportResults');
    
    try {
        showToast('Generating report...', 'info');
        
        let report = null;
        
        switch(type) {
            case 'monthly': {
                const month = document.getElementById('reportMonth').value || null;
                report = await API.getMonthlyReport(month);
                break;
            }
            case '15day': {
                report = await API.getDueReport('15day');
                break;
            }
            case '5day': {
                report = await API.getDueReport('5day');
                break;
            }
            case 'dateRange': {
                const startDate = new Date(document.getElementById('reportStartDate').value);
                const endDate = new Date(document.getElementById('reportEndDate').value);
                
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    showToast('Please select valid dates', 'warning');
                    return;
                }
                
                report = await API.getDateRangeReport(startDate, endDate);
                break;
            }
            case 'empty': {
                report = await API.getDueReport('empty');
                break;
            }
        }
        
        if (report) {
            displayReport(report);
            reportResults.style.display = 'block';
            showToast('Report generated successfully', 'success');
        }
        
    } catch (error) {
        console.error('Report generation error:', error);
        showToast('Failed to generate report: ' + error.message, 'error');
    }
}

// ==========================================================
// DISPLAY REPORT
// ==========================================================

function displayReport(report) {
    document.getElementById('reportTitle').textContent = report.title || 'Report Results';
    document.getElementById('reportMeta').textContent = `Generated: ${formatDate(report.generatedDate)}`;
    
    // Display summary
    const summary = document.getElementById('reportSummary');
    const summaryData = report.summary || {};
    
    let summaryHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
    `;
    
    for (const [key, value] of Object.entries(summaryData)) {
        summaryHTML += `
            <div>
                <div style="font-size:12px;color:#666;">${key.replace(/_/g, ' ').toUpperCase()}</div>
                <div style="font-weight:600;font-size:16px;color:#1a3c6e;">${value}</div>
            </div>
        `;
    }
    
    summaryHTML += '</div>';
    summary.innerHTML = summaryHTML;
    
    // Display table
    const details = report.details || [];
    const headers = details.length > 0 ? Object.keys(details[0]) : [];
    
    if (headers.length === 0) {
        document.getElementById('reportTableHead').innerHTML = '';
        document.getElementById('reportTableBody').innerHTML = `
            <tr>
                <td colspan="100" class="text-center text-muted">No data available</td>
            </tr>
        `;
        return;
    }
    
    // Build table headers
    const headerHTML = `
        <tr>
            ${headers.map(h => `<th>${h.replace(/_/g, ' ').toUpperCase()}</th>`).join('')}
        </tr>
    `;
    document.getElementById('reportTableHead').innerHTML = headerHTML;
    
    // Build table body
    const bodyHTML = details.map(row => `
        <tr>
            ${headers.map(h => `<td>${row[h] || '-'}</td>`).join('')}
        </tr>
    `).join('');
    document.getElementById('reportTableBody').innerHTML = bodyHTML;
}

// ==========================================================
// EXPORT REPORT
// ==========================================================

async function exportReport() {
    const type = document.getElementById('reportType').value;
    
    try {
        showToast('Exporting report...', 'info');
        const result = await API.exportData(type);
        
        if (result && result.length > 0) {
            result.forEach(file => {
                window.open(file.url, '_blank');
            });
            showToast('Export successful', 'success');
        } else {
            showToast('No data to export', 'warning');
        }
        
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed: ' + error.message, 'error');
    }
}