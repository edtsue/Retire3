// --- Constants ---
var DEFAULT_WITHDRAWAL_RATE = 4; // percent
const PROJECTION_YEARS = [1, 5, 10, 15, 20, 25];
const DEFAULT_AGE = 44;
const DEFAULT_INFLATION = 2.8;
const STORAGE_KEY = 'retire3_savedPlan';
const MAX_ASSET_VALUE = 999999999999;

const ASSET_COLORS = {
    stocks: '#22c55e',
    cash: '#3b82f6',
    retirement: '#f59e0b',
    insurance: '#a855f7',
    realestate: '#ef4444'
};
const ASSET_LABELS = {
    stocks: 'Stocks',
    cash: 'Cash/CD/Bonds',
    retirement: 'Retirement',
    insurance: 'Insurance',
    realestate: 'Real Estate'
};
const ASSET_IDS = ['stocks', 'cash', 'retirement', 'insurance', 'realestate'];

// --- Cached DOM refs ---
const dom = {};
function cacheDom() {
    ASSET_IDS.forEach(function(id) {
        dom[id + 'Amount'] = document.getElementById(id + '-amount');
        dom[id + 'Arr'] = document.getElementById(id + '-arr');
        dom[id + 'Slider'] = document.getElementById(id + '-arr-slider');
    });
    dom.age = document.getElementById('age');
    dom.inflation = document.getElementById('inflation');
    dom.totalAssets = document.getElementById('total-assets');
    dom.projectBtn = document.getElementById('project-btn');
    dom.projectNoExpensesBtn = document.getElementById('project-no-expenses-btn');
    dom.resetBtn = document.getElementById('reset-btn');
    dom.saveBtn = document.getElementById('save-btn');
    dom.loadBtn = document.getElementById('load-btn');
    dom.tutorialBtn = document.getElementById('tutorial-btn');
    dom.tutorialOverlay = document.getElementById('tutorial-modal-overlay');
    dom.tutorialClose = document.getElementById('tutorial-modal-close');
    dom.incomeDisplay = document.getElementById('income-display');
    dom.annualIncome = document.getElementById('annual-income');
    dom.summaryCards = document.getElementById('summary-cards');
    dom.summaryTotal = document.getElementById('summary-total');
    dom.summaryIncome = document.getElementById('summary-income');
    dom.summaryYears = document.getElementById('summary-years');
    dom.chartSkeleton = document.getElementById('chart-skeleton');
    dom.chartPlaceholder = document.getElementById('chart-placeholder');
    dom.projectionChart = document.getElementById('projectionChart');
    dom.assetBreakdown = document.getElementById('asset-breakdown');
    dom.breakdownBars = document.getElementById('breakdown-bars');
    dom.breakdownLegend = document.getElementById('breakdown-legend');
    dom.toast = document.getElementById('toast');
    dom.themeToggle = document.getElementById('theme-toggle');
    dom.themeIcon = document.getElementById('theme-icon');
    dom.downloadBtn = document.getElementById('download-btn');
    dom.compareBtn = document.getElementById('compare-btn');
    dom.chartActions = document.getElementById('chart-actions');
    dom.levelUpBanner = document.getElementById('level-up-banner');
    dom.coinParticles = document.getElementById('coin-particles');
    dom.summaryReal = document.getElementById('summary-real');
    dom.summaryRealSub = document.getElementById('summary-real-sub');
    dom.withdrawalRate = document.getElementById('withdrawal-rate');
    dom.withdrawalRateDisplay = document.getElementById('withdrawal-rate-display');
}

// --- Sanitization ---
function sanitizeNumber(val, min, max, fallback) {
    var num = parseFloat(val);
    if (isNaN(num) || !isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, num));
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// --- Helper functions ---
function getWithdrawalRate() {
    if (dom.withdrawalRate) {
        var val = parseFloat(dom.withdrawalRate.value);
        if (!isNaN(val) && val >= 1 && val <= 10) return val / 100;
    }
    return DEFAULT_WITHDRAWAL_RATE / 100;
}

function formatCurrency(amount) {
    return '$' + Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function parseNumber(str) {
    var cleaned = String(str || '').replace(/[^0-9.\-]/g, '');
    var num = parseFloat(cleaned) || 0;
    return Math.max(-MAX_ASSET_VALUE, Math.min(MAX_ASSET_VALUE, num));
}

function formatInputWithCommas(input) {
    var value = input.value.replace(/,/g, '');
    if (value === '' || isNaN(Number(value))) return;
    var num = parseFloat(value);
    num = Math.max(0, Math.min(MAX_ASSET_VALUE, num));
    input.value = num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// --- Debounce ---
function debounce(fn, delay) {
    var timer;
    return function() {
        var args = arguments;
        var ctx = this;
        clearTimeout(timer);
        timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
    };
}

// --- Toast notification ---
function showToast(message, duration) {
    duration = duration || 2200;
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() {
        dom.toast.classList.remove('show');
    }, duration);
}

// --- Animated count-up ---
function animateValue(el, start, end, duration) {
    duration = duration || 900;
    var startTime = performance.now();
    function update(currentTime) {
        var elapsed = currentTime - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = start + (end - start) * eased;
        el.textContent = formatCurrency(current);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// --- Dark Mode ---
function initTheme() {
    var saved = localStorage.getItem('retire3_theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    setTheme(theme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('retire3_theme', theme);
    dom.themeIcon.textContent = theme === 'dark' ? '\u2600' : '\u263E';
}

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
}

// --- Big Expenses ---
var MAX_EXPENSES = 5;
var bigExpenses = []; // [{name: string, amount: number, yearsFromNow: number}]

function openExpensesModal() {
    var overlay = document.getElementById('expenses-modal-overlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderExpensesList();
}

function closeExpensesModal() {
    var overlay = document.getElementById('expenses-modal-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    // Read values from DOM inputs before closing
    syncExpensesFromDOM();
    updateExpensesButton();
}

function syncExpensesFromDOM() {
    var items = document.querySelectorAll('.expense-item');
    bigExpenses = [];
    items.forEach(function(item) {
        var name = item.querySelector('.expense-name').value.trim();
        var amount = parseNumber(item.querySelector('.expense-amount').value);
        var years = parseInt(item.querySelector('.expense-years').value, 10) || 0;
        if (name && amount > 0 && years > 0) {
            bigExpenses.push({ name: name, amount: amount, yearsFromNow: years });
        }
    });
}

function renderExpensesList() {
    var list = document.getElementById('expenses-list');
    var html = '';
    bigExpenses.forEach(function(exp, i) {
        html += '<div class="expense-item" data-index="' + i + '">';
        html += '<input type="text" class="expense-name" placeholder="e.g. College" value="' + escapeHtml(exp.name) + '" maxlength="30">';
        html += '<div class="expense-amount-group"><span class="input-prefix">$</span>';
        html += '<input type="text" class="expense-amount" inputmode="numeric" placeholder="0" value="' + (exp.amount > 0 ? exp.amount.toLocaleString('en-US', {maximumFractionDigits: 0}) : '') + '"></div>';
        html += '<div class="expense-year-group">';
        html += '<input type="number" class="expense-years" min="1" max="50" value="' + (exp.yearsFromNow || '') + '" placeholder="0">';
        html += '<span class="input-unit">yrs</span></div>';
        html += '<button type="button" class="expense-remove-btn" data-index="' + i + '" title="Remove">&times;</button>';
        html += '</div>';
    });
    list.innerHTML = html;

    // Bind remove buttons
    list.querySelectorAll('.expense-remove-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var idx = parseInt(btn.getAttribute('data-index'), 10);
            bigExpenses.splice(idx, 1);
            renderExpensesList();
        });
    });

    // Format amount inputs
    list.querySelectorAll('.expense-amount').forEach(function(input) {
        input.addEventListener('input', function() {
            formatInputWithCommas(input);
        });
    });

    updateExpensesCount();
}

function addExpense() {
    syncExpensesFromDOM();
    if (bigExpenses.length >= MAX_EXPENSES) {
        showToast('Maximum ' + MAX_EXPENSES + ' expenses');
        return;
    }
    bigExpenses.push({ name: '', amount: 0, yearsFromNow: 0 });
    renderExpensesList();
    // Focus the name input of the newly added expense
    var items = document.querySelectorAll('.expense-item');
    if (items.length > 0) {
        var lastItem = items[items.length - 1];
        lastItem.querySelector('.expense-name').focus();
    }
}

function updateExpensesCount() {
    var count = document.getElementById('expenses-count');
    var addBtn = document.getElementById('expenses-add-btn');
    count.textContent = bigExpenses.length + ' / ' + MAX_EXPENSES + ' expenses';
    addBtn.disabled = bigExpenses.length >= MAX_EXPENSES;
}

function updateExpensesButton() {
    var btn = document.getElementById('expenses-btn');
    var validExpenses = bigExpenses.filter(function(e) { return e.name && e.amount > 0 && e.yearsFromNow > 0; });
    if (validExpenses.length > 0) {
        btn.classList.add('has-expenses');
        btn.innerHTML = '&#128176; ' + validExpenses.length + ' Expense' + (validExpenses.length > 1 ? 's' : '');
    } else {
        btn.classList.remove('has-expenses');
        btn.innerHTML = '&#10133; Expenses';
    }
}

function getValidExpenses() {
    return bigExpenses.filter(function(e) { return e.name && e.amount > 0 && e.yearsFromNow > 0; });
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function() {
    cacheDom();
    initTheme();

    var debouncedUpdate = debounce(function() {
        updateTotalAssets();
        updateBreakdown();
    }, 120);

    // Format asset amount fields
    ASSET_IDS.forEach(function(id) {
        var el = dom[id + 'Amount'];
        var slider = dom[id + 'Slider'];
        var arrInput = dom[id + 'Arr'];

        if (el) {
            formatInputWithCommas(el);
            el.addEventListener('input', function(e) {
                formatInputWithCommas(e.target);
                debouncedUpdate();
            });
        }

        // Sync slider <-> number input
        if (slider && arrInput) {
            slider.addEventListener('input', function() {
                arrInput.value = slider.value;
            });
            arrInput.addEventListener('input', function() {
                var val = sanitizeNumber(arrInput.value, -50, 50, 0);
                slider.value = Math.max(-10, Math.min(20, val));
            });
        }
    });

    // Zero-out buttons
    document.querySelectorAll('.zero-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var assetId = btn.getAttribute('data-zero');
            var input = dom[assetId + 'Amount'];
            if (input) {
                input.value = '0';
                debouncedUpdate();
                showToast(ASSET_LABELS[assetId] + ' set to $0');
            }
        });
    });

    updateTotalAssets();
    updateBreakdown();
    setupPresets();
    setupTipsButtons();
    setPreset('average');

    // Expenses modal
    document.getElementById('expenses-btn').addEventListener('click', openExpensesModal);
    document.getElementById('expenses-modal-close').addEventListener('click', closeExpensesModal);
    document.getElementById('expenses-add-btn').addEventListener('click', addExpense);
    document.getElementById('expenses-done-btn').addEventListener('click', closeExpensesModal);
    document.getElementById('expenses-modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeExpensesModal();
    });

    // Withdrawal rate input
    dom.withdrawalRate.addEventListener('input', function() {
        var rate = getWithdrawalRate();
        dom.withdrawalRateDisplay.textContent = dom.withdrawalRate.value;
        // Recalculate income if projection exists
        if (lastProjectionData && lastProjectionData.data.length > 0) {
            var lastValue = lastProjectionData.data[lastProjectionData.data.length - 1];
            var income = lastValue * rate;
            dom.summaryIncome.textContent = formatCurrency(income);
            dom.annualIncome.textContent = formatCurrency(income);
        }
    });

    dom.projectBtn.addEventListener('click', function() { calculateProjection(); });
    dom.projectNoExpensesBtn.addEventListener('click', calculateProjectionNoExpenses);
    dom.resetBtn.addEventListener('click', resetForm);
    dom.saveBtn.addEventListener('click', savePlan);
    dom.loadBtn.addEventListener('click', loadPlan);
    dom.themeToggle.addEventListener('click', toggleTheme);
    dom.downloadBtn.addEventListener('click', downloadChart);
    dom.compareBtn.addEventListener('click', addComparisonScenario);

    // Tutorial modal
    dom.tutorialBtn.addEventListener('click', function() {
        dom.tutorialOverlay.classList.add('active');
    });
    dom.tutorialClose.addEventListener('click', function() {
        dom.tutorialOverlay.classList.remove('active');
    });
    dom.tutorialOverlay.addEventListener('click', function(e) {
        if (e.target === dom.tutorialOverlay) {
            dom.tutorialOverlay.classList.remove('active');
        }
    });

    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to project
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            calculateProjection();
        }
    });
});

// --- Preset ARR values ---
// Historical average annual returns (nominal, pre-inflation)
// Conservative: tilted toward bonds/fixed income, lower inflation assumption
// Average: blended historical long-term averages (S&P ~10%, bonds ~5%, RE ~4-5%)
// Aggressive: higher-equity tilted, higher inflation expectation
var presets = {
    conservative: { stocks: 7, cash: 3.5, retirement: 6, insurance: 3, realestate: 3.5, inflation: 2.0 },
    average: { stocks: 10, cash: 4.5, retirement: 7.5, insurance: 4, realestate: 4.5, inflation: 2.5 },
    aggressive: { stocks: 12.5, cash: 5, retirement: 10, insurance: 5, realestate: 7, inflation: 3.5 }
};

var activePreset = null;

function setupPresets() {
    document.getElementById('conservative-btn').addEventListener('click', function() { setPreset('conservative'); });
    document.getElementById('average-btn').addEventListener('click', function() { setPreset('average'); });
    document.getElementById('aggressive-btn').addEventListener('click', function() { setPreset('aggressive'); });
    document.getElementById('monte-carlo-btn').addEventListener('click', runMonteCarlo);
}

function setPreset(type) {
    var preset = presets[type];
    ASSET_IDS.forEach(function(id) {
        dom[id + 'Arr'].value = preset[id];
        dom[id + 'Slider'].value = preset[id];
    });

    // Set inflation rate for this preset
    dom.inflation.value = preset.inflation;

    activePreset = type;
    document.querySelectorAll('.preset-btn').forEach(function(btn) { btn.classList.remove('active'); });
    document.getElementById(type + '-btn').classList.add('active');

    var label = type.charAt(0).toUpperCase() + type.slice(1);
    showToast(label + ' preset applied (' + preset.inflation + '% inflation)');
}

// --- Total assets ---
function updateTotalAssets() {
    var total = 0;
    ASSET_IDS.forEach(function(id) {
        total += parseNumber(dom[id + 'Amount'].value);
    });
    dom.totalAssets.textContent = formatCurrency(total);
}

// --- Asset Breakdown ---
function updateBreakdown() {
    var values = {};
    var total = 0;
    ASSET_IDS.forEach(function(id) {
        values[id] = parseNumber(dom[id + 'Amount'].value);
        total += values[id];
    });

    if (total <= 0) {
        dom.assetBreakdown.style.display = 'none';
        return;
    }

    dom.assetBreakdown.style.display = 'block';

    var barsHtml = '';
    var legendHtml = '';
    ASSET_IDS.forEach(function(id) {
        var pct = (values[id] / total) * 100;
        if (pct > 0.5) {
            barsHtml += '<div class="breakdown-segment" style="width:' + pct.toFixed(1) + '%;background:' + ASSET_COLORS[id] + ';" title="' + escapeHtml(ASSET_LABELS[id]) + ': ' + pct.toFixed(1) + '%"></div>';
            legendHtml += '<span class="legend-item"><span class="legend-dot" style="background:' + ASSET_COLORS[id] + ';"></span>' + escapeHtml(ASSET_LABELS[id]) + ' <span class="legend-pct">' + pct.toFixed(0) + '%</span></span>';
        }
    });
    dom.breakdownBars.innerHTML = barsHtml;
    dom.breakdownLegend.innerHTML = legendHtml;
}

// --- Save / Load ---
function savePlan() {
    var data = {
        age: dom.age.value,
        inflation: dom.inflation.value,
        assets: {},
        expenses: getValidExpenses(),
        preset: activePreset,
        savedAt: new Date().toISOString()
    };
    ASSET_IDS.forEach(function(id) {
        data.assets[id] = {
            amount: dom[id + 'Amount'].value,
            arr: dom[id + 'Arr'].value
        };
    });
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        showToast('Plan saved');
    } catch (e) {
        showToast('Could not save — storage full');
    }
}

function loadPlan() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            showToast('No saved plan found');
            return;
        }
        var data = JSON.parse(raw);

        dom.age.value = sanitizeNumber(data.age, 18, 100, DEFAULT_AGE);
        dom.inflation.value = sanitizeNumber(data.inflation, 0, 20, DEFAULT_INFLATION);

        ASSET_IDS.forEach(function(id) {
            if (data.assets && data.assets[id]) {
                dom[id + 'Amount'].value = data.assets[id].amount || '0';
                formatInputWithCommas(dom[id + 'Amount']);
                var arr = sanitizeNumber(data.assets[id].arr, -50, 50, 0);
                dom[id + 'Arr'].value = arr;
                dom[id + 'Slider'].value = Math.max(-10, Math.min(20, arr));
            }
        });

        if (data.preset && presets[data.preset]) {
            activePreset = data.preset;
            document.querySelectorAll('.preset-btn').forEach(function(btn) { btn.classList.remove('active'); });
            document.getElementById(data.preset + '-btn').classList.add('active');
        }

        // Load expenses
        if (data.expenses && Array.isArray(data.expenses)) {
            bigExpenses = data.expenses.filter(function(e) {
                return e.name && typeof e.name === 'string' && e.amount > 0 && e.yearsFromNow > 0;
            }).slice(0, 5).map(function(e) {
                return {
                    name: e.name.substring(0, 30),
                    amount: Math.max(0, Math.min(1e12, Number(e.amount) || 0)),
                    yearsFromNow: Math.max(1, Math.min(50, Math.floor(Number(e.yearsFromNow) || 0)))
                };
            });
        } else {
            bigExpenses = [];
        }
        updateExpensesButton();

        updateTotalAssets();
        updateBreakdown();
        showToast('SAVE FILE LOADED!');
    } catch (e) {
        showToast('Error loading plan');
    }
}

// --- Reset form ---
function resetForm() {
    dom.age.value = DEFAULT_AGE;
    dom.inflation.value = DEFAULT_INFLATION;
    ASSET_IDS.forEach(function(id) {
        dom[id + 'Amount'].value = '0';
        dom[id + 'Arr'].value = '0';
        dom[id + 'Slider'].value = 0;
    });

    activePreset = null;
    document.querySelectorAll('.preset-btn').forEach(function(btn) { btn.classList.remove('active'); });

    // Clear expenses
    bigExpenses = [];
    updateExpensesButton();

    updateTotalAssets();
    updateBreakdown();

    if (window.projChart) {
        window.projChart.destroy();
        window.projChart = null;
    }
    dom.incomeDisplay.style.display = 'none';
    dom.summaryCards.style.display = 'none';
    dom.chartActions.style.display = 'none';
    dom.projectionChart.style.display = 'none';
    dom.chartPlaceholder.style.display = 'flex';
    dom.levelUpBanner.style.display = 'none';
    comparisonData = null;

    showToast('GAME RESET!');
}

// --- Projection ---
var lastProjectionData = null;
var comparisonData = null;

function calculateProjectionNoExpenses() {
    calculateProjection(true);
}

function calculateProjection(skipExpenses) {
    var age = sanitizeNumber(dom.age.value, 18, 100, DEFAULT_AGE);
    var inflation = sanitizeNumber(dom.inflation.value, 0, 20, DEFAULT_INFLATION);

    var amounts = {};
    var arrs = {};
    var totalInput = 0;
    ASSET_IDS.forEach(function(id) {
        amounts[id] = parseNumber(dom[id + 'Amount'].value);
        arrs[id] = sanitizeNumber(dom[id + 'Arr'].value, -50, 50, 0);
        totalInput += amounts[id];
    });

    if (totalInput <= 0) {
        showToast('Enter asset values first');
        return;
    }

    // Warn on negative real returns
    document.querySelectorAll('.negative-return-warning').forEach(function(el) { el.remove(); });
    var hasNegative = false;
    ASSET_IDS.forEach(function(id) {
        var realReturn = arrs[id] - inflation;
        if (realReturn < 0 && amounts[id] > 0) {
            hasNegative = true;
            var card = document.querySelector('[data-asset="' + id + '"]');
            var warning = document.createElement('div');
            warning.className = 'negative-return-warning';
            warning.textContent = 'Real return: ' + realReturn.toFixed(1) + '% (below inflation)';
            card.appendChild(warning);
        }
    });

    // Adjusted ARR (real returns)
    var adjArrs = {};
    ASSET_IDS.forEach(function(id) {
        adjArrs[id] = arrs[id] - inflation;
    });

    // Get valid expenses
    var expenses = skipExpenses ? [] : getValidExpenses();

    // Build chart years: merge standard projection years with expense years
    var maxYear = PROJECTION_YEARS[PROJECTION_YEARS.length - 1];
    var chartYearsSet = {};
    PROJECTION_YEARS.forEach(function(y) { chartYearsSet[y] = true; });
    expenses.forEach(function(exp) {
        if (exp.yearsFromNow >= 1 && exp.yearsFromNow <= maxYear) {
            chartYearsSet[exp.yearsFromNow] = true;
        }
    });
    var chartYears = Object.keys(chartYearsSet).map(Number).sort(function(a, b) { return a - b; });

    var labels = chartYears.map(function(year) {
        return year + ' yrs (Age ' + (age + year) + ')';
    });

    // Year-by-year simulation to handle expense deductions
    var balances = {};
    var nominalBalances = {};
    ASSET_IDS.forEach(function(id) {
        balances[id] = amounts[id];
        nominalBalances[id] = amounts[id];
    });

    var projections = [];
    var checkpoint = 0;

    for (var y = 1; y <= maxYear; y++) {
        // Grow each asset for one year
        ASSET_IDS.forEach(function(id) {
            balances[id] = balances[id] * (1 + adjArrs[id] / 100);
            nominalBalances[id] = nominalBalances[id] * (1 + arrs[id] / 100);
        });

        // Deduct any expenses that occur this year (proportionally across assets)
        expenses.forEach(function(exp) {
            if (exp.yearsFromNow === y) {
                var totalNow = 0;
                ASSET_IDS.forEach(function(id) { totalNow += balances[id]; });
                if (totalNow > 0) {
                    ASSET_IDS.forEach(function(id) {
                        var share = balances[id] / totalNow;
                        balances[id] = Math.max(0, balances[id] - exp.amount * share);
                    });
                }
                var nomTotal = 0;
                ASSET_IDS.forEach(function(id) { nomTotal += nominalBalances[id]; });
                if (nomTotal > 0) {
                    var nominalExpense = exp.amount * Math.pow(1 + inflation / 100, y);
                    ASSET_IDS.forEach(function(id) {
                        var share = nominalBalances[id] / nomTotal;
                        nominalBalances[id] = Math.max(0, nominalBalances[id] - nominalExpense * share);
                    });
                }
            }
        });

        // Record at chart year checkpoints
        if (chartYears[checkpoint] === y) {
            var total = 0;
            ASSET_IDS.forEach(function(id) { total += balances[id]; });
            projections.push(Math.max(0, total));
            checkpoint++;
        }
    }

    // Compute nominal total at end
    var nominalTotal = 0;
    ASSET_IDS.forEach(function(id) { nominalTotal += nominalBalances[id]; });
    nominalTotal = Math.max(0, nominalTotal);

    lastProjectionData = { labels: labels, data: projections };

    // Show skeleton
    dom.chartPlaceholder.style.display = 'none';
    dom.chartSkeleton.style.display = 'flex';
    dom.projectionChart.style.display = 'none';
    dom.summaryCards.style.display = 'none';
    dom.chartActions.style.display = 'none';

    setTimeout(function() {
        dom.chartSkeleton.style.display = 'none';
        dom.projectionChart.style.display = 'block';
        renderChart(labels, projections, expenses, chartYears);

        var lastValue = projections[projections.length - 1];
        var lastIncome = lastValue * getWithdrawalRate();
        dom.summaryCards.style.display = 'grid';
        dom.summaryYears.textContent = 'After ' + PROJECTION_YEARS[PROJECTION_YEARS.length - 1] + ' years';
        animateValue(dom.summaryTotal, 0, lastValue, 1000);
        animateValue(dom.summaryIncome, 0, lastIncome, 1000);

        // Nominal value (future account balance without inflation adjustment)
        animateValue(dom.summaryReal, 0, nominalTotal, 1000);
        dom.summaryRealSub.textContent = 'Future dollars (' + inflation + '% inflation)';

        dom.incomeDisplay.style.display = 'block';
        dom.annualIncome.textContent = formatCurrency(lastIncome);
        dom.chartActions.style.display = 'flex';

        // Retro: show Level Up if projected level > current level
        showLevelUp(lastValue);

        if (hasNegative) showToast('Some assets have negative real returns', 3000);
    }, 450);
}

function renderChart(labels, data, expenses, chartYears) {
    expenses = expenses || [];
    chartYears = chartYears || PROJECTION_YEARS;
    var ctx = dom.projectionChart.getContext('2d');
    if (window.projChart) window.projChart.destroy();

    // Build per-point styling for expense markers
    var expenseYearSet = {};
    var expenseLabelsMap = {};
    expenses.forEach(function(exp) {
        expenseYearSet[exp.yearsFromNow] = true;
        if (!expenseLabelsMap[exp.yearsFromNow]) expenseLabelsMap[exp.yearsFromNow] = [];
        expenseLabelsMap[exp.yearsFromNow].push(exp.name + ' (-$' + exp.amount.toLocaleString('en-US', {maximumFractionDigits: 0}) + ')');
    });

    var pointBgColors = chartYears.map(function(year) {
        return expenseYearSet[year] ? '#ef4444' : '#22c55e';
    });
    var pointBorderColors = chartYears.map(function(year) {
        return expenseYearSet[year] ? '#ef4444' : 'var(--bg-card-solid)';
    });
    var pointRadii = chartYears.map(function(year) {
        return expenseYearSet[year] ? 9 : 6;
    });
    var pointStyles = chartYears.map(function(year) {
        return expenseYearSet[year] ? 'triangle' : 'circle';
    });
    var pointRotations = chartYears.map(function(year) {
        return expenseYearSet[year] ? 180 : 0; // downward triangle
    });

    // Store for plugin use
    window._expenseLabelsMap = expenseLabelsMap;
    window._chartYears = chartYears;

    var datasets = [{
        label: 'Projected Assets',
        data: data,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: pointBgColors,
        pointBorderColor: pointBorderColors,
        pointBorderWidth: 2,
        pointRadius: pointRadii,
        pointStyle: pointStyles,
        pointRotation: pointRotations,
        pointHoverRadius: 10,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#22c55e',
        pointHoverBorderWidth: 3
    }];

    if (comparisonData) {
        datasets.push({
            label: 'Comparison',
            data: comparisonData.data,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.06)',
            borderWidth: 2,
            borderDash: [6, 4],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8
        });
    }

    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    var tickColor = isDark ? '#a0a4b8' : '#666';

    // Plugin to draw expense labels on chart
    var expenseLabelPlugin = {
        id: 'expenseLabels',
        afterDatasetsDraw: function(chart) {
            if (!window._expenseLabelsMap || !window._chartYears) return;
            var meta = chart.getDatasetMeta(0);
            var ctx2 = chart.ctx;
            window._chartYears.forEach(function(year, i) {
                if (window._expenseLabelsMap[year]) {
                    var point = meta.data[i];
                    if (!point) return;
                    var x = point.x;
                    var y = point.y;
                    ctx2.save();
                    ctx2.fillStyle = '#ef4444';
                    ctx2.font = 'bold 10px Inter, sans-serif';
                    ctx2.textAlign = 'center';
                    var labelLines = window._expenseLabelsMap[year];
                    var totalHeight = labelLines.length * 13;
                    labelLines.forEach(function(line, li) {
                        ctx2.fillText(line, x, y - 18 - totalHeight + (li * 13));
                    });
                    ctx2.restore();
                }
            });
        }
    };

    window.projChart = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        plugins: [expenseLabelPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1200, easing: 'easeOutQuart' },
            layout: { padding: { bottom: 10, top: 10 } },
            plugins: {
                legend: {
                    display: comparisonData ? true : false,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 16,
                        color: tickColor,
                        font: { family: "'Inter', sans-serif", weight: '600', size: 12 }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: isDark ? 'rgba(30,32,44,0.95)' : 'rgba(26,26,46,0.95)',
                    titleFont: { size: 12, family: "'Inter', sans-serif" },
                    bodyFont: { size: 13, weight: '600', family: "'Inter', sans-serif" },
                    padding: 14,
                    cornerRadius: 10,
                    displayColors: comparisonData ? true : false,
                    callbacks: {
                        label: function(context) {
                            var total = formatCurrency(context.parsed.y);
                            var income = formatCurrency(context.parsed.y * getWithdrawalRate());
                            var line = context.dataset.label + ': ' + total + '  |  Income: ' + income;
                            return line;
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex !== 0) return '';
                            var years = window._chartYears || PROJECTION_YEARS;
                            var year = years[context.dataIndex];
                            if (window._expenseLabelsMap && window._expenseLabelsMap[year]) {
                                return '\u26A0 ' + window._expenseLabelsMap[year].join(', ');
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return formatCurrency(value); },
                        color: tickColor,
                        font: { size: 11, family: "'Inter', sans-serif" }
                    },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        color: tickColor,
                        font: { size: 11, family: "'Inter', sans-serif" }
                    },
                    grid: { color: gridColor }
                }
            },
            interaction: { intersect: false, mode: 'index' },
            onHover: function(event, elements) {
                if (elements.length > 0) {
                    var index = elements[0].index;
                    var value = data[index];
                    dom.annualIncome.textContent = formatCurrency(value * getWithdrawalRate());
                }
            }
        }
    });
}

// --- Scenario Comparison ---
function addComparisonScenario() {
    if (!lastProjectionData) {
        showToast('Project first, then compare');
        return;
    }
    if (comparisonData) {
        // Clear comparison
        comparisonData = null;
        renderChart(lastProjectionData.labels, lastProjectionData.data);
        dom.compareBtn.textContent = 'Compare Scenario';
        showToast('Comparison cleared');
        return;
    }
    // Snapshot current as comparison
    comparisonData = {
        labels: lastProjectionData.labels.slice(),
        data: lastProjectionData.data.slice()
    };
    dom.compareBtn.textContent = 'Clear Comparison';
    showToast('Scenario saved — adjust values and Project again to compare');
}

// --- Download chart ---
function downloadChart() {
    if (!window.projChart) {
        showToast('Generate a projection first');
        return;
    }
    var timestamp = new Date().toISOString().slice(0, 10);
    var link = document.createElement('a');
    link.download = 'financial-projection-' + timestamp + '.png';
    link.href = window.projChart.toBase64Image();
    link.click();
    showToast('SAVE FILE ACQUIRED!');
}

// --- 16-BIT RETRO GAME FEATURES ---

// Coin particle burst
function spawnCoinBurst(count) {
    for (var i = 0; i < count; i++) {
        (function(delay) {
            setTimeout(function() {
                var coin = document.createElement('div');
                coin.className = 'coin-particle';
                coin.textContent = '\u2605';
                coin.style.left = (30 + Math.random() * 40) + '%';
                coin.style.top = (40 + Math.random() * 20) + '%';
                coin.style.color = Math.random() > 0.5 ? '#ffd700' : '#ffaa00';
                dom.coinParticles.appendChild(coin);
                setTimeout(function() { coin.remove(); }, 1100);
            }, delay * 80);
        })(i);
    }
}

// Show Level Up banner on projection (coin burst celebration)
function showLevelUp(totalProjected) {
    var currentTotal = parseNumber(dom.totalAssets.textContent.replace('$', ''));
    if (totalProjected > currentTotal * 1.5) {
        dom.levelUpBanner.style.display = 'block';
        dom.levelUpBanner.querySelector('.level-up-text').textContent = 'GROWTH UNLOCKED!';
        spawnCoinBurst(10);
        setTimeout(function() {
            dom.levelUpBanner.style.display = 'none';
        }, 4000);
    } else {
        dom.levelUpBanner.style.display = 'none';
    }
}

// --- MONTE CARLO SIMULATION ---
// Historical annual standard deviations (volatility) by asset class
var ASSET_VOLATILITY = {
    stocks: 16.0,       // S&P 500 historical ~16%
    cash: 2.0,          // Cash/CDs/short bonds ~2%
    retirement: 12.0,   // Blended retirement portfolio ~12%
    insurance: 1.5,     // Insurance/annuity ~1.5%
    realestate: 10.0    // Real estate ~10%
};

var MC_SIMULATIONS = 2000;
var MC_YEARS = [1, 5, 10, 15, 20, 25];

// Box-Muller transform for normal random numbers
function randNormal() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function runMonteCarlo() {
    var age = sanitizeNumber(dom.age.value, 18, 100, DEFAULT_AGE);
    var inflation = sanitizeNumber(dom.inflation.value, 0, 20, DEFAULT_INFLATION);

    var amounts = {};
    var arrs = {};
    var totalInput = 0;
    ASSET_IDS.forEach(function(id) {
        amounts[id] = parseNumber(dom[id + 'Amount'].value);
        arrs[id] = sanitizeNumber(dom[id + 'Arr'].value, -50, 50, 0);
        totalInput += amounts[id];
    });

    if (totalInput <= 0) {
        showToast('Enter asset values first');
        return;
    }

    // Show loading state
    dom.chartPlaceholder.style.display = 'none';
    dom.chartSkeleton.style.display = 'flex';
    dom.projectionChart.style.display = 'none';
    dom.summaryCards.style.display = 'none';
    dom.chartActions.style.display = 'none';

    showToast('Rolling the dice... ' + MC_SIMULATIONS + ' simulations');

    // Get expenses for MC
    var mcExpenses = getValidExpenses();

    setTimeout(function() {
        // Run simulations
        var maxYear = MC_YEARS[MC_YEARS.length - 1];
        var allPaths = []; // array of arrays: each path has value at each MC_YEARS checkpoint

        for (var sim = 0; sim < MC_SIMULATIONS; sim++) {
            var yearTotals = [];
            var checkpoint = 0;

            // Track running balances per asset
            var balances = {};
            ASSET_IDS.forEach(function(id) {
                balances[id] = amounts[id];
            });

            for (var y = 1; y <= maxYear; y++) {
                // Apply random return for each asset this year
                ASSET_IDS.forEach(function(id) {
                    var meanReturn = (arrs[id] - inflation) / 100;
                    var vol = ASSET_VOLATILITY[id] / 100;
                    var randomReturn = meanReturn + vol * randNormal();
                    balances[id] = balances[id] * (1 + randomReturn);
                    if (balances[id] < 0) balances[id] = 0;
                });

                // Deduct expenses at the right year (proportionally across assets)
                mcExpenses.forEach(function(exp) {
                    if (exp.yearsFromNow === y) {
                        var totalNow = 0;
                        ASSET_IDS.forEach(function(id) { totalNow += balances[id]; });
                        if (totalNow > 0) {
                            ASSET_IDS.forEach(function(id) {
                                var share = balances[id] / totalNow;
                                balances[id] = Math.max(0, balances[id] - exp.amount * share);
                            });
                        }
                    }
                });

                // Check if this year is a checkpoint
                if (MC_YEARS[checkpoint] === y) {
                    var total = 0;
                    ASSET_IDS.forEach(function(id) {
                        total += balances[id];
                    });
                    yearTotals.push(Math.max(0, total));
                    checkpoint++;
                }
            }
            allPaths.push(yearTotals);
        }

        // Calculate percentiles at each checkpoint
        var percentiles = { p10: [], p25: [], p50: [], p75: [], p90: [] };

        for (var c = 0; c < MC_YEARS.length; c++) {
            var values = [];
            for (var s = 0; s < MC_SIMULATIONS; s++) {
                values.push(allPaths[s][c]);
            }
            values.sort(function(a, b) { return a - b; });

            percentiles.p10.push(values[Math.floor(MC_SIMULATIONS * 0.10)]);
            percentiles.p25.push(values[Math.floor(MC_SIMULATIONS * 0.25)]);
            percentiles.p50.push(values[Math.floor(MC_SIMULATIONS * 0.50)]);
            percentiles.p75.push(values[Math.floor(MC_SIMULATIONS * 0.75)]);
            percentiles.p90.push(values[Math.floor(MC_SIMULATIONS * 0.90)]);
        }

        var labels = MC_YEARS.map(function(year) {
            return year + ' yrs (Age ' + (age + year) + ')';
        });

        // Store for summary
        lastProjectionData = { labels: labels, data: percentiles.p50 };

        // Render fan chart
        dom.chartSkeleton.style.display = 'none';
        dom.projectionChart.style.display = 'block';
        renderMonteCarloChart(labels, percentiles);

        // Update summary with median (50th percentile)
        var medianFinal = percentiles.p50[percentiles.p50.length - 1];
        var medianIncome = medianFinal * getWithdrawalRate();
        dom.summaryCards.style.display = 'grid';
        dom.summaryYears.textContent = 'After ' + MC_YEARS[MC_YEARS.length - 1] + ' yrs (median)';
        animateValue(dom.summaryTotal, 0, medianFinal, 1000);
        animateValue(dom.summaryIncome, 0, medianIncome, 1000);

        // Nominal value for Monte Carlo
        // MC uses inflation-adjusted returns, so medianFinal is real
        // Convert back to nominal: nominal = real * (1+inf)^t
        var mcLastYears = MC_YEARS[MC_YEARS.length - 1];
        var mcNominal = medianFinal * Math.pow(1 + inflation / 100, mcLastYears);
        animateValue(dom.summaryReal, 0, mcNominal, 1000);
        dom.summaryRealSub.textContent = 'Future dollars (' + inflation + '% inflation)';

        dom.incomeDisplay.style.display = 'block';
        dom.annualIncome.textContent = formatCurrency(medianIncome);
        dom.chartActions.style.display = 'flex';

        showLevelUp(medianFinal);

        // Monte Carlo specific toast with range
        var p10Final = formatCurrency(percentiles.p10[percentiles.p10.length - 1]);
        var p90Final = formatCurrency(percentiles.p90[percentiles.p90.length - 1]);
        showToast('80% chance: ' + p10Final + ' - ' + p90Final, 4000);

        spawnCoinBurst(8);
    }, 500);
}

// --- ASSET TIPS & STRATEGIES ---
var ASSET_TIPS = {
    stocks: {
        icon: '\uD83D\uDCC8',
        title: 'GROW YOUR STOCKS',
        tips: [
            {
                title: 'Use Low-Cost Index Funds as Your Core',
                desc: 'Broad index funds (S&P 500, total market) provide instant diversification at minimal cost. Most active managers underperform the index over time.',
                link: 'https://www.nerdwallet.com/investing/learn/how-to-invest-in-index-funds',
                source: 'NerdWallet'
            },
            {
                title: 'Dollar-Cost Average Consistently',
                desc: 'Invest a fixed amount on a regular schedule regardless of market conditions. This removes emotion from investing and reduces the impact of volatility.',
                link: 'https://www.fidelity.com/learning-center/personal-finance/guide-to-dollar-cost-averaging',
                source: 'Fidelity'
            },
            {
                title: 'Diversify Beyond U.S. Large-Cap Tech',
                desc: 'The top 10 stocks now dominate index weight. Spread across sectors, market caps, and international markets to reduce concentration risk.',
                link: 'https://www.morningstar.com/markets/nows-time-diversify-beyond-magnificent-seven-stocks-2',
                source: 'Morningstar'
            },
            {
                title: 'Rebalance Your Portfolio Regularly',
                desc: 'After strong performance, your allocation may drift. Rebalance back to your target mix to lock in gains and manage risk.',
                link: 'https://investor.vanguard.com/investor-resources-education/portfolio-management/rebalancing-your-portfolio',
                source: 'Vanguard'
            },
            {
                title: 'Favor Quality Companies with Strong Cash Flows',
                desc: 'Focus on businesses with durable profitability and solid balance sheets. Dividend-paying stocks in healthcare, utilities, and industrials add stability.',
                link: 'https://www.schwab.com/learn/story/it-may-be-time-to-consider-dividend-paying-stocks',
                source: 'Schwab'
            },
            {
                title: 'Include International Stocks',
                desc: 'Non-U.S. markets may offer more attractive valuations after lagging for a decade. International exposure reduces dependence on any single economy.',
                link: 'https://www.schwab.com/learn/story/why-invest-international-stocks',
                source: 'Schwab'
            }
        ]
    },
    cash: {
        icon: '\uD83C\uDFE6',
        title: 'GROW YOUR CASH',
        tips: [
            {
                title: 'Use a High-Yield Savings Account (HYSA)',
                desc: 'Top HYSAs pay 3.8-4.2% APY \u2014 far more than standard banks. Set up automatic transfers so your cash grows without effort.',
                link: 'https://www.bankrate.com/banking/savings/best-high-yield-interests-savings-accounts/',
                source: 'Bankrate'
            },
            {
                title: 'Build a CD Ladder',
                desc: 'Spread savings across CDs with staggered maturities (3, 6, 12, 24 months). As each matures, reinvest into longer terms. Balances liquidity with higher yields.',
                link: 'https://www.bankrate.com/banking/cds/cd-ladder-guide/',
                source: 'Bankrate'
            },
            {
                title: 'Buy Series I Savings Bonds',
                desc: 'I Bonds from the U.S. Treasury adjust with inflation (currently ~4%). Essentially risk-free with a 1-year minimum holding period.',
                link: 'https://www.nerdwallet.com/investing/learn/i-bonds',
                source: 'NerdWallet'
            },
            {
                title: 'Consider Short-Term Treasury Bills',
                desc: 'T-bills mature in under a year, are government-backed, and their interest is exempt from state and local taxes.',
                link: 'https://www.nerdwallet.com/investing/learn/treasury-bills',
                source: 'NerdWallet'
            },
            {
                title: 'Use Money Market Accounts for Yield + Access',
                desc: 'Money market accounts are FDIC-insured and offer ~4% APY with check-writing access \u2014 a good middle ground between savings and CDs.',
                link: 'https://www.nerdwallet.com/banking/best/money-market-accounts',
                source: 'NerdWallet'
            },
            {
                title: 'Lock In Rates Before They Drop Further',
                desc: 'Economists expect rates to continue falling. Locking in current yields on CDs and bonds today beats waiting in a low-rate checking account.',
                link: 'https://www.bankrate.com/banking/savings/savings-money-market-account-rate-forecast/',
                source: 'Bankrate'
            }
        ]
    },
    retirement: {
        icon: '\uD83C\uDFC6',
        title: 'GROW RETIREMENT',
        tips: [
            {
                title: 'Max Out Your Contributions',
                desc: '401(k) limit is $24,500 for 2026. IRA limit is $7,500. Aim to contribute as much as possible toward these caps each year.',
                link: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500',
                source: 'IRS.gov'
            },
            {
                title: 'Always Capture the Full Employer Match',
                desc: 'Contribute at least enough to get your full employer match. Leaving match money on the table means forgoing a guaranteed 50-100% return.',
                link: 'https://www.fidelity.com/learning-center/smart-money/average-401k-match',
                source: 'Fidelity'
            },
            {
                title: 'Use Catch-Up Contributions (Age 50+)',
                desc: 'Workers 50+ can add $8,000 extra to a 401(k) in 2026. Ages 60-63 get a \u201Csuper catch-up\u201D of $11,250 on top of the standard limit.',
                link: 'https://www.schwab.com/learn/story/what-to-know-about-catch-up-contributions',
                source: 'Schwab'
            },
            {
                title: 'Set Up Automatic Escalation',
                desc: 'Enroll in your plan\u2019s auto-escalation to increase contributions by 1-2% annually, timed with raises. Grows savings without feeling a pay cut.',
                link: 'https://www.fidelity.com/viewpoints/retirement/save-more',
                source: 'Fidelity'
            },
            {
                title: 'Choose the Right Account Type for Your Tax Bracket',
                desc: 'Expect higher taxes in retirement? Prioritize Roth (tax-free withdrawals). Need a break now? Use traditional pre-tax. Having both gives tax diversification.',
                link: 'https://www.schwab.com/learn/story/roth-vs-traditional-401k-which-is-better',
                source: 'Schwab'
            },
            {
                title: 'Explore Roth Conversions & Backdoor Roth',
                desc: 'Convert traditional IRA to Roth to pay taxes now and enjoy tax-free growth later. High earners can use backdoor Roth or mega backdoor strategies.',
                link: 'https://www.schwab.com/learn/story/backdoor-roth-is-it-right-you',
                source: 'Schwab'
            }
        ]
    },
    insurance: {
        icon: '\uD83D\uDEE1\uFE0F',
        title: 'GROW INSURANCE',
        tips: [
            {
                title: 'Choose Whole Life for Cash Value Growth',
                desc: 'Term life has no investment component. Whole life from a mutual insurer pays dividends and offers guaranteed growth for cash value accumulation.',
                link: 'https://www.insuranceandestates.com/whole-life-insurance-cash-value-chart/',
                source: 'Insurance & Estates'
            },
            {
                title: 'Overfund Early with Paid-Up Additions (PUAs)',
                desc: 'Pay above the minimum premium in the first 5-10 years using PUA riders. This dramatically accelerates cash value compounding. Stay under MEC limits.',
                link: 'https://www.insuranceandestates.com/paid-up-additions/',
                source: 'Insurance & Estates'
            },
            {
                title: 'Use Tax-Free Policy Loans Instead of Withdrawals',
                desc: 'Borrow against your cash value rather than withdrawing. Loans are not taxable, and your full cash value continues earning dividends.',
                link: 'https://www.insuranceandestates.com/life-insurance-loans/',
                source: 'Insurance & Estates'
            },
            {
                title: 'Reinvest Dividends to Buy Paid-Up Insurance',
                desc: 'Direct dividends back into the policy to purchase additional paid-up insurance. This compounds your value without additional out-of-pocket cost.',
                link: 'https://www.insuranceandestates.com/top-10-best-dividend-paying-whole-life-insurance-companies/',
                source: 'Insurance & Estates'
            },
            {
                title: 'Choose a Strong Mutual Insurance Company',
                desc: 'Pick a participating whole life policy from a top-tier mutual insurer with decades of consistent dividend history (e.g., MassMutual, Northwestern, Guardian).',
                link: 'https://www.nerdwallet.com/insurance/life/best-mutual-life-insurance-companies',
                source: 'NerdWallet'
            },
            {
                title: 'Maintain Loan Discipline & Review Annually',
                desc: 'Over-borrowing without a repayment plan can erode benefits or trigger a taxable lapse. Repay systematically and review universal life policies yearly.',
                link: 'https://www.insuranceandestates.com/borrowing-against-life-insurance-pros-and-cons/',
                source: 'Insurance & Estates'
            }
        ]
    },
    realestate: {
        icon: '\uD83C\uDFE0',
        title: 'GROW REAL ESTATE',
        tips: [
            {
                title: 'Invest in REITs for Liquid Exposure',
                desc: 'REITs provide diversified real estate exposure without property management. They must distribute 90%+ of income as dividends, yielding ~3.8-4%.',
                link: 'https://www.nerdwallet.com/article/investing/reit-investing',
                source: 'NerdWallet'
            },
            {
                title: 'Start with Single-Family Rentals',
                desc: 'Lower entry cost and simpler management. Use the 1% rule: monthly rent should be at least 1% of purchase price for positive cash flow.',
                link: 'https://www.biggerpockets.com/blog/single-family-investing-benefits',
                source: 'BiggerPockets'
            },
            {
                title: 'Tap Home Equity Strategically',
                desc: 'Use a HELOC or cash-out refi to fund your next investment. Your primary residence appreciates while borrowed equity funds a cash-flowing rental.',
                link: 'https://www.bankrate.com/home-equity/using-home-equity-to-invest/',
                source: 'Bankrate'
            },
            {
                title: 'Diversify Across Property Types & Locations',
                desc: 'Spread across residential, industrial, and retail in different metros. Sun Belt markets offer growth; stable core markets provide reliable income.',
                link: 'https://www.nerdwallet.com/article/investing/5-ways-to-invest-in-real-estate',
                source: 'NerdWallet'
            },
            {
                title: 'Prioritize Cash Flow Over Speculation',
                desc: 'In the current rate environment, focus on properties that generate positive cash flow from day one. Run conservative underwriting at today\u2019s rates.',
                link: 'https://www.biggerpockets.com/blog/rental-property-cash-flow-analysis',
                source: 'BiggerPockets'
            },
            {
                title: 'Explore Emerging Niche Sectors',
                desc: 'Data centers (98% occupancy from AI demand), senior living, and build-to-rent communities are the fastest-growing segments. Access via specialized REITs.',
                link: 'https://www.fool.com/investing/stock-market/market-sectors/real-estate-investing/reit/data-center-reit/',
                source: 'Motley Fool'
            }
        ]
    }
};

function openTipsModal(assetId) {
    var tips = ASSET_TIPS[assetId];
    if (!tips) return;

    var overlay = document.getElementById('tips-modal-overlay');
    var modal = document.getElementById('tips-modal');
    var icon = document.getElementById('tips-modal-icon');
    var title = document.getElementById('tips-modal-title');
    var body = document.getElementById('tips-modal-body');

    icon.textContent = tips.icon;
    title.textContent = tips.title;
    modal.setAttribute('data-asset', assetId);

    var html = '';
    tips.tips.forEach(function(tip, i) {
        html += '<div class="tip-item">';
        html += '<span class="tip-number">' + (i + 1) + '</span>';
        html += '<div class="tip-content">';
        html += '<div class="tip-title">' + escapeHtml(tip.title) + '</div>';
        html += '<div class="tip-desc">' + escapeHtml(tip.desc) + '</div>';
        if (tip.link) {
            html += '<a class="tip-link" href="' + escapeHtml(tip.link) + '" target="_blank" rel="noopener noreferrer">';
            html += 'Read more on ' + escapeHtml(tip.source) + ' &#8599;</a>';
        }
        html += '</div></div>';
    });
    body.innerHTML = html;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTipsModal() {
    var overlay = document.getElementById('tips-modal-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

function setupTipsButtons() {
    document.querySelectorAll('.tips-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var assetId = btn.getAttribute('data-tips');
            openTipsModal(assetId);
        });
    });

    document.getElementById('tips-modal-close').addEventListener('click', closeTipsModal);

    document.getElementById('tips-modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeTipsModal();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var tipsOverlay = document.getElementById('tips-modal-overlay');
            if (tipsOverlay.classList.contains('active')) {
                closeTipsModal();
                return;
            }
            var expOverlay = document.getElementById('expenses-modal-overlay');
            if (expOverlay.classList.contains('active')) {
                closeExpensesModal();
                return;
            }
            if (dom.tutorialOverlay.classList.contains('active')) {
                dom.tutorialOverlay.classList.remove('active');
            }
        }
    });
}

function renderMonteCarloChart(labels, pct) {
    var ctx = dom.projectionChart.getContext('2d');
    if (window.projChart) window.projChart.destroy();

    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    var tickColor = isDark ? '#a0a4b8' : '#666';

    var datasets = [
        // Median line (center) — first so it appears at the top of the legend
        {
            label: 'Median (50th)',
            data: pct.p50,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.08)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#22c55e',
            pointBorderColor: isDark ? '#1e202c' : '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 10,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#22c55e',
            pointHoverBorderWidth: 3
        },
        // 90th percentile (best case)
        {
            label: '90th percentile',
            data: pct.p90,
            borderColor: 'rgba(34, 197, 94, 0.25)',
            backgroundColor: 'rgba(34, 197, 94, 0.06)',
            borderWidth: 1,
            borderDash: [4, 4],
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: 'rgba(34, 197, 94, 0.5)',
            pointBorderWidth: 0
        },
        // 75th percentile
        {
            label: '75th percentile',
            data: pct.p75,
            borderColor: 'rgba(34, 197, 94, 0.45)',
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            borderWidth: 1.5,
            fill: '+1',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: 'rgba(34, 197, 94, 0.7)',
            pointBorderWidth: 0
        },
        // 25th percentile
        {
            label: '25th percentile',
            data: pct.p25,
            borderColor: 'rgba(245, 158, 11, 0.45)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderWidth: 1.5,
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: 'rgba(245, 158, 11, 0.7)',
            pointBorderWidth: 0
        },
        // 10th percentile (worst case)
        {
            label: '10th percentile',
            data: pct.p10,
            borderColor: 'rgba(239, 68, 68, 0.25)',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            borderWidth: 1,
            borderDash: [4, 4],
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: 'rgba(239, 68, 68, 0.5)',
            pointBorderWidth: 0
        }
    ];

    window.projChart = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1200, easing: 'easeOutQuart' },
            layout: { padding: { bottom: 10, top: 10 } },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 12,
                        color: tickColor,
                        font: { family: "'Inter', sans-serif", weight: '600', size: 11 },
                        filter: function(item) {
                            // Only show key labels
                            return ['Median (50th)', '75th percentile', '25th percentile', '90th percentile', '10th percentile'].indexOf(item.text) >= 0;
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: isDark ? 'rgba(30,32,44,0.95)' : 'rgba(26,26,46,0.95)',
                    titleFont: { size: 12, family: "'Inter', sans-serif" },
                    bodyFont: { size: 12, weight: '600', family: "'Inter', sans-serif" },
                    padding: 14,
                    cornerRadius: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            var val = formatCurrency(context.parsed.y);
                            return context.dataset.label + ': ' + val;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return formatCurrency(value); },
                        color: tickColor,
                        font: { size: 11, family: "'Inter', sans-serif" }
                    },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        color: tickColor,
                        font: { size: 11, family: "'Inter', sans-serif" }
                    },
                    grid: { color: gridColor }
                }
            },
            interaction: { intersect: false, mode: 'index' },
            onHover: function(event, elements) {
                if (elements.length > 0) {
                    var index = elements[0].index;
                    var medianVal = pct.p50[index];
                    dom.annualIncome.textContent = formatCurrency(medianVal * getWithdrawalRate());
                }
            }
        }
    });
}
