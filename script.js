// --- Helper functions ---
function formatCurrency(amount) {
    return '$' + Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function parseNumber(str) {
    return parseFloat((str || '').replace(/,/g, '')) || 0;
}

function formatInputWithCommas(input) {
    let value = input.value.replace(/,/g, '');
    if (value === '' || isNaN(Number(value))) return;
    let num = parseFloat(value);
    input.value = num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function() {
    // Format asset amount fields with commas on page load
    ['stocks-amount', 'cash-amount', 'retirement-amount', 'insurance-amount', 'realestate-amount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            formatInputWithCommas(el);
            el.addEventListener('input', function(e) {
                formatInputWithCommas(e.target);
                updateTotalAssets();
            });
        }
    });
    updateTotalAssets();
    setupPresets();
    document.getElementById('project-btn').addEventListener('click', calculateProjection);
    document.getElementById('reset-btn').addEventListener('click', resetForm);
});

// --- Preset ARR values ---
const presets = {
    conservative: { stocks: 5, cash: 2, retirement: 4, insurance: 2, realestate: 2 },
    average: { stocks: 8, cash: 3, retirement: 6, insurance: 3, realestate: 5 },
    aggressive: { stocks: 12, cash: 4, retirement: 8, insurance: 4, realestate: 8 }
};

function setupPresets() {
    document.getElementById('conservative-btn').onclick = () => setPreset('conservative');
    document.getElementById('average-btn').onclick = () => setPreset('average');
    document.getElementById('aggressive-btn').onclick = () => setPreset('aggressive');
}

function setPreset(type) {
    const preset = presets[type];
    document.getElementById('stocks-arr').value = preset.stocks;
    document.getElementById('cash-arr').value = preset.cash;
    document.getElementById('retirement-arr').value = preset.retirement;
    document.getElementById('insurance-arr').value = preset.insurance;
    document.getElementById('realestate-arr').value = preset.realestate;
}

// --- Total assets calculation ---
function updateTotalAssets() {
    const stocks = parseNumber(document.getElementById('stocks-amount').value);
    const cash = parseNumber(document.getElementById('cash-amount').value);
    const retirement = parseNumber(document.getElementById('retirement-amount').value);
    const insurance = parseNumber(document.getElementById('insurance-amount').value);
    const realestate = parseNumber(document.getElementById('realestate-amount').value);
    const total = stocks + cash + retirement + insurance + realestate;
    document.getElementById('total-assets').textContent = formatCurrency(total);
}

// --- Reset form ---
function resetForm() {
    document.getElementById('age').value = 43;
    document.getElementById('inflation').value = 2.5;
    document.getElementById('stocks-amount').value = '1,200,000';
    document.getElementById('cash-amount').value = '300,000';
    document.getElementById('retirement-amount').value = '1,000,000';
    document.getElementById('insurance-amount').value = '115,000';
    document.getElementById('realestate-amount').value = '1,200,000';
    document.getElementById('stocks-arr').value = '';
    document.getElementById('cash-arr').value = '';
    document.getElementById('retirement-arr').value = '';
    document.getElementById('insurance-arr').value = '';
    document.getElementById('realestate-arr').value = '';
    updateTotalAssets();
    if (window.chart) {
        window.chart.destroy();
        window.chart = null;
    }
    document.getElementById('income-display').style.display = 'none';
}

// --- Chart.js projection ---
function calculateProjection() {
    // Get values
    const age = parseFloat(document.getElementById('age').value) || 43;
    const inflation = parseFloat(document.getElementById('inflation').value) || 2.5;
    const stocksAmount = parseNumber(document.getElementById('stocks-amount').value);
    const stocksArr = parseFloat(document.getElementById('stocks-arr').value) || 0;
    const cashAmount = parseNumber(document.getElementById('cash-amount').value);
    const cashArr = parseFloat(document.getElementById('cash-arr').value) || 0;
    const retirementAmount = parseNumber(document.getElementById('retirement-amount').value);
    const retirementArr = parseFloat(document.getElementById('retirement-arr').value) || 0;
    const insuranceAmount = parseNumber(document.getElementById('insurance-amount').value);
    const insuranceArr = parseFloat(document.getElementById('insurance-arr').value) || 0;
    const realestateAmount = parseNumber(document.getElementById('realestate-amount').value);
    const realestateArr = parseFloat(document.getElementById('realestate-arr').value) || 0;

    // Adjust ARR for inflation
    const adjStocksArr = stocksArr - inflation;
    const adjCashArr = cashArr - inflation;
    const adjRetirementArr = retirementArr - inflation;
    const adjInsuranceArr = insuranceArr - inflation;
    const adjRealestateArr = realestateArr - inflation;

    // Years and labels
    const years = [1, 5, 10, 15, 20, 25];
    const labels = years.map(year => `${year} years (Age ${age + year})`);

    // Projections
    const projections = years.map(year => {
        const stocksValue = stocksAmount * Math.pow(1 + adjStocksArr / 100, year);
        const cashValue = cashAmount * Math.pow(1 + adjCashArr / 100, year);
        const retirementValue = retirementAmount * Math.pow(1 + adjRetirementArr / 100, year);
        const insuranceValue = insuranceAmount * Math.pow(1 + adjInsuranceArr / 100, year);
        const realestateValue = realestateAmount * Math.pow(1 + adjRealestateArr / 100, year);
        return stocksValue + cashValue + retirementValue + insuranceValue + realestateValue;
    });

    renderChart(labels, projections);
    document.getElementById('income-display').style.display = 'block';
}

function renderChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (window.chart) window.chart.destroy();
    window.chart = new Chart(ctx, {
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
            layout: { padding: { bottom: 50 } },
            plugins: {
                legend: { display: false },
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
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                },
                x: {
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                }
            },
            interaction: { intersect: false, mode: 'index' },
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
    // Custom hover for annual income
    document.getElementById('projectionChart').onmousemove = function(event) {
        const points = window.chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
        if (points.length) {
            const idx = points[0].index;
            const value = data[idx];
            document.getElementById('annual-income').textContent = formatCurrency(value * 0.04);
        }
    };
}

// --- Advanced features (stubs) ---
function downloadChart() {
    if (!window.chart) return alert('Please generate a projection first.');
    const link = document.createElement('a');
    link.download = 'financial-projection.png';
    link.href = window.chart.toBase64Image();
    link.click();
}

function shareResults() {
    alert('Share Results feature coming soon!');
}

function savePlan() {
    alert('Save Plan feature coming soon!');
} 