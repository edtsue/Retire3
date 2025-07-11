// Global variables
let chart = null;
let projectionData = null;

// Preset ARR values
const presets = {
    conservative: {
        stocks: 5,
        cash: 2,
        retirement: 4,
        insurance: 2
    },
    average: {
        stocks: 8, // changed from 7 to 8
        cash: 3,
        retirement: 6,
        insurance: 3
    },
    aggressive: {
        stocks: 12,
        cash: 4,
        retirement: 8,
        insurance: 4
    }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    updateTotalAssets();
    setupEventListeners();
    // Format asset amount fields with commas on page load
    ['stocks-amount', 'cash-amount', 'retirement-amount', 'insurance-amount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            formatInputWithCommas(el);
        }
    });
});

// Helper to format with commas as user types
function formatInputWithCommas(input) {
    let value = input.value.replace(/,/g, '');
    if (value === '' || isNaN(Number(value))) return;
    let num = parseFloat(value);
    input.value = num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Attach to asset amount fields after DOMContentLoaded
function setupEventListeners() {
    // Update total assets when any amount field changes
    const amountInputs = ['stocks-amount', 'cash-amount', 'retirement-amount', 'insurance-amount'];
    amountInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', function(e) {
            // Only format if the value is a valid number
            if (/^\d{1,15}$/.test(e.target.value.replace(/,/g, ''))) {
                formatInputWithCommas(e.target);
            }
            updateTotalAssets();
        });
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            calculateProjection();
        }
    });
}

// Format currency with commas
function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Set preset ARR values
function setPreset(presetType) {
    const preset = presets[presetType];
    document.getElementById('stocks-arr').value = preset.stocks;
    document.getElementById('cash-arr').value = preset.cash;
    document.getElementById('retirement-arr').value = preset.retirement;
    document.getElementById('insurance-arr').value = preset.insurance;
}

// Validate inputs and show warnings
function validateInputs() {
    const age = parseFloat(document.getElementById('age').value);
    const inflation = parseFloat(document.getElementById('inflation').value);
    const stocksArr = parseFloat(document.getElementById('stocks-arr').value);
    const cashArr = parseFloat(document.getElementById('cash-arr').value);
    const retirementArr = parseFloat(document.getElementById('retirement-arr').value);
    const insuranceArr = parseFloat(document.getElementById('insurance-arr').value);
    
    let warnings = [];
    
    if (age < 18 || age > 100) {
        warnings.push('Age seems unusually low or high');
    }
    if (inflation < 0 || inflation > 20) {
        warnings.push('Inflation rate seems unusual');
    }
    if (stocksArr < -50 || stocksArr > 50) {
        warnings.push('Stocks ARR seems extreme');
    }
    if (cashArr < -50 || cashArr > 50) {
        warnings.push('Cash ARR seems extreme');
    }
    if (retirementArr < -50 || retirementArr > 50) {
        warnings.push('Retirement ARR seems extreme');
    }
    if (insuranceArr < -50 || insuranceArr > 50) {
        warnings.push('Insurance ARR seems extreme');
    }
    
    if (warnings.length > 0) {
        alert('Warning: ' + warnings.join(', ') + '. Please double-check your inputs.');
    }
}

// When reading values for calculations, always strip commas:
function getNumberValue(id) {
    return parseFloat((document.getElementById(id).value || '0').replace(/,/g, '')) || 0;
}

// Update total assets display
function updateTotalAssets() {
    const stocks = getNumberValue('stocks-amount');
    const cash = getNumberValue('cash-amount');
    const retirement = getNumberValue('retirement-amount');
    const insurance = getNumberValue('insurance-amount');
    
    const total = stocks + cash + retirement + insurance;
    document.getElementById('total-assets').textContent = formatCurrency(total);
}

// Calculate projection
function calculateProjection() {
    validateInputs();
    
    // Get input values
    const age = parseFloat(document.getElementById('age').value) || 43;
    const inflation = parseFloat(document.getElementById('inflation').value) || 2.5;
    const stocksAmount = getNumberValue('stocks-amount');
    const stocksArr = parseFloat(document.getElementById('stocks-arr').value) || 0;
    const cashAmount = getNumberValue('cash-amount');
    const cashArr = parseFloat(document.getElementById('cash-arr').value) || 0;
    const retirementAmount = getNumberValue('retirement-amount');
    const retirementArr = parseFloat(document.getElementById('retirement-arr').value) || 0;
    const insuranceAmount = getNumberValue('insurance-amount');
    const insuranceArr = parseFloat(document.getElementById('insurance-arr').value) || 0;
    
    // Calculate adjusted ARR (subtract inflation)
    const adjustedStocksArr = stocksArr - inflation;
    const adjustedCashArr = cashArr - inflation;
    const adjustedRetirementArr = retirementArr - inflation;
    const adjustedInsuranceArr = insuranceArr - inflation;
    
    // Years to project
    const years = [1, 5, 10, 15, 20, 25];
    const labels = years.map(year => `${year} years (Age ${age + year})`);
    
    // Calculate projections
    const projections = years.map(year => {
        const stocksValue = stocksAmount * Math.pow(1 + adjustedStocksArr / 100, year);
        const cashValue = cashAmount * Math.pow(1 + adjustedCashArr / 100, year);
        const retirementValue = retirementAmount * Math.pow(1 + adjustedRetirementArr / 100, year);
        const insuranceValue = insuranceAmount * Math.pow(1 + adjustedInsuranceArr / 100, year);
        
        return stocksValue + cashValue + retirementValue + insuranceValue;
    });
    
    projectionData = { years, projections, labels };
    createChart(labels, projections);
    
    // Show income display
    document.getElementById('income-display').style.display = 'block';
}

// Create the chart
function createChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Assets',
                data: data,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#27ae60',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 50 // Add extra space for x-axis labels
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return 'Total: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            onHover: function(event, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const value = data[index];
                    const annualIncome = value * 0.04;
                    document.getElementById('annual-income').textContent = formatCurrency(annualIncome);
                }
            }
        }
    });
    
    // Add custom hover functionality
    const canvas = document.getElementById('projectionChart');
    canvas.addEventListener('mousemove', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const points = chart.getDatasetMeta(0).data;
        let closestPoint = null;
        let minDistance = Infinity;
        
        points.forEach((point, index) => {
            const distance = Math.sqrt(
                Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
            );
            if (distance < minDistance && distance < 30) {
                minDistance = distance;
                closestPoint = index;
            }
        });
        
        if (closestPoint !== null) {
            const value = data[closestPoint];
            const annualIncome = value * 0.04;
            document.getElementById('annual-income').textContent = formatCurrency(annualIncome);
        }
    });
}

// Reset form to defaults
function resetForm() {
    document.getElementById('age').value = 43;
    document.getElementById('inflation').value = 2.5;
    document.getElementById('stocks-amount').value = '';
    document.getElementById('stocks-arr').value = '';
    document.getElementById('cash-amount').value = '';
    document.getElementById('cash-arr').value = '';
    document.getElementById('retirement-amount').value = '';
    document.getElementById('retirement-arr').value = '';
    document.getElementById('insurance-amount').value = '';
    document.getElementById('insurance-arr').value = '';
    
    updateTotalAssets();
    
    // Hide chart and income display
    if (chart) {
        chart.destroy();
        chart = null;
    }
    document.getElementById('income-display').style.display = 'none';
}

// Advanced features
function downloadChart() {
    if (!chart) {
        alert('Please generate a projection first.');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'financial-projection.png';
    link.href = chart.toBase64Image();
    link.click();
}

function shareResults() {
    if (!projectionData) {
        alert('Please generate a projection first.');
        return;
    }
    
    const results = {
        age: document.getElementById('age').value,
        inflation: document.getElementById('inflation').value,
        assets: {
            stocks: document.getElementById('stocks-amount').value,
            cash: document.getElementById('cash-amount').value,
            retirement: document.getElementById('retirement-amount').value,
            insurance: document.getElementById('insurance-amount').value
        },
        projections: projectionData
    };
    
    const resultsText = JSON.stringify(results, null, 2);
    const blob = new Blob([resultsText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'financial-plan.json';
    link.click();
    
    URL.revokeObjectURL(url);
}

function savePlan() {
    const plan = {
        age: document.getElementById('age').value,
        inflation: document.getElementById('inflation').value,
        stocksAmount: document.getElementById('stocks-amount').value,
        stocksArr: document.getElementById('stocks-arr').value,
        cashAmount: document.getElementById('cash-amount').value,
        cashArr: document.getElementById('cash-arr').value,
        retirementAmount: document.getElementById('retirement-amount').value,
        retirementArr: document.getElementById('retirement-arr').value,
        insuranceAmount: document.getElementById('insurance-amount').value,
        insuranceArr: document.getElementById('insurance-arr').value,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('financialPlan', JSON.stringify(plan));
    alert('Plan saved to browser storage!');
}

// Load saved plan
function loadSavedPlan() {
    const saved = localStorage.getItem('financialPlan');
    if (saved) {
        const plan = JSON.parse(saved);
        document.getElementById('age').value = plan.age || 43;
        document.getElementById('inflation').value = plan.inflation || 2.5;
        document.getElementById('stocks-amount').value = plan.stocksAmount || '';
        document.getElementById('stocks-arr').value = plan.stocksArr || '';
        document.getElementById('cash-amount').value = plan.cashAmount || '';
        document.getElementById('cash-arr').value = plan.cashArr || '';
        document.getElementById('retirement-amount').value = plan.retirementAmount || '';
        document.getElementById('retirement-arr').value = plan.retirementArr || '';
        document.getElementById('insurance-amount').value = plan.insuranceAmount || '';
        document.getElementById('insurance-arr').value = plan.insuranceArr || '';
        
        updateTotalAssets();
    }
}

// Load saved plan on page load
document.addEventListener('DOMContentLoaded', loadSavedPlan); 