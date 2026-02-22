// --- Constants ---
const WITHDRAWAL_RATE = 0.04;
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
    dom.resetBtn = document.getElementById('reset-btn');
    dom.saveBtn = document.getElementById('save-btn');
    dom.loadBtn = document.getElementById('load-btn');
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
    dom.xpBarWrapper = document.getElementById('xp-bar-wrapper');
    dom.xpFill = document.getElementById('xp-fill');
    dom.xpText = document.getElementById('xp-text');
    dom.coinParticles = document.getElementById('coin-particles');
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

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function() {
    cacheDom();
    initTheme();

    var debouncedUpdate = debounce(function() {
        updateTotalAssets();
        updateBreakdown();
        updateXpBar();
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

    updateTotalAssets();
    updateBreakdown();
    updateXpBar();
    setupPresets();

    dom.projectBtn.addEventListener('click', calculateProjection);
    dom.resetBtn.addEventListener('click', resetForm);
    dom.saveBtn.addEventListener('click', savePlan);
    dom.loadBtn.addEventListener('click', loadPlan);
    dom.themeToggle.addEventListener('click', toggleTheme);
    dom.downloadBtn.addEventListener('click', downloadChart);
    dom.compareBtn.addEventListener('click', addComparisonScenario);

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

        updateTotalAssets();
        updateBreakdown();
        updateXpBar();
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
    dom.xpBarWrapper.style.display = 'none';
    previousLevel = 0;
    comparisonData = null;

    showToast('GAME RESET!');
}

// --- Projection ---
var lastProjectionData = null;
var comparisonData = null;

function calculateProjection() {
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

    // Adjusted ARR
    var adjArrs = {};
    ASSET_IDS.forEach(function(id) {
        adjArrs[id] = arrs[id] - inflation;
    });

    var labels = PROJECTION_YEARS.map(function(year) {
        return year + ' yrs (Age ' + (age + year) + ')';
    });

    var projections = PROJECTION_YEARS.map(function(year) {
        var total = 0;
        ASSET_IDS.forEach(function(id) {
            total += amounts[id] * Math.pow(1 + adjArrs[id] / 100, year);
        });
        return Math.max(0, total);
    });

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
        renderChart(labels, projections);

        var lastValue = projections[projections.length - 1];
        var lastIncome = lastValue * WITHDRAWAL_RATE;
        dom.summaryCards.style.display = 'grid';
        dom.summaryYears.textContent = 'After ' + PROJECTION_YEARS[PROJECTION_YEARS.length - 1] + ' years';
        animateValue(dom.summaryTotal, 0, lastValue, 1000);
        animateValue(dom.summaryIncome, 0, lastIncome, 1000);

        dom.incomeDisplay.style.display = 'block';
        dom.annualIncome.textContent = formatCurrency(lastIncome);
        dom.chartActions.style.display = 'flex';

        // Retro: show Level Up if projected level > current level
        showLevelUp(lastValue);

        if (hasNegative) showToast('Some assets have negative real returns', 3000);
    }, 450);
}

function renderChart(labels, data) {
    var ctx = dom.projectionChart.getContext('2d');
    if (window.projChart) window.projChart.destroy();

    var datasets = [{
        label: 'Projected Assets',
        data: data,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: 'var(--bg-card-solid)',
        pointBorderWidth: 2,
        pointRadius: 6,
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
                            var income = formatCurrency(context.parsed.y * WITHDRAWAL_RATE);
                            return context.dataset.label + ': ' + total + '  |  Income: ' + income;
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
                    dom.annualIncome.textContent = formatCurrency(value * WITHDRAWAL_RATE);
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

// XP bar: maps total assets to a level / XP percentage
var XP_LEVELS = [
    { min: 0,          label: 'LVL 1 - PEASANT' },
    { min: 100000,     label: 'LVL 2 - SQUIRE' },
    { min: 250000,     label: 'LVL 3 - KNIGHT' },
    { min: 500000,     label: 'LVL 4 - BARON' },
    { min: 1000000,    label: 'LVL 5 - LORD' },
    { min: 2000000,    label: 'LVL 6 - DUKE' },
    { min: 5000000,    label: 'LVL 7 - KING' },
    { min: 10000000,   label: 'LVL 8 - EMPEROR' },
    { min: 50000000,   label: 'LVL 9 - LEGEND' },
    { min: 100000000,  label: 'LVL MAX - GOD MODE' }
];

function getLevel(totalAssets) {
    var level = XP_LEVELS[0];
    for (var i = XP_LEVELS.length - 1; i >= 0; i--) {
        if (totalAssets >= XP_LEVELS[i].min) {
            level = XP_LEVELS[i];
            break;
        }
    }
    return { index: XP_LEVELS.indexOf(level), label: level.label, min: level.min };
}

function getXpPercent(totalAssets) {
    var lvl = getLevel(totalAssets);
    var nextIdx = Math.min(lvl.index + 1, XP_LEVELS.length - 1);
    if (lvl.index === XP_LEVELS.length - 1) return 100;
    var range = XP_LEVELS[nextIdx].min - lvl.min;
    var progress = totalAssets - lvl.min;
    return Math.min(100, Math.max(0, (progress / range) * 100));
}

var previousLevel = 0;

function updateXpBar() {
    var total = 0;
    ASSET_IDS.forEach(function(id) {
        total += parseNumber(dom[id + 'Amount'].value);
    });

    if (total <= 0) {
        dom.xpBarWrapper.style.display = 'none';
        return;
    }

    dom.xpBarWrapper.style.display = 'block';
    var lvl = getLevel(total);
    var pct = getXpPercent(total);

    dom.xpFill.style.width = pct.toFixed(1) + '%';
    dom.xpText.textContent = lvl.label;

    // Check for level up
    if (lvl.index > previousLevel && previousLevel > 0) {
        showToast('LEVEL UP! ' + lvl.label);
        spawnCoinBurst(6);
    }
    previousLevel = lvl.index;
}

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

// Show Level Up banner on projection
function showLevelUp(totalProjected) {
    var lvl = getLevel(totalProjected);
    var currentLvl = getLevel(parseNumber(dom.totalAssets.textContent.replace('$', '')));

    if (lvl.index > currentLvl.index) {
        dom.levelUpBanner.style.display = 'block';
        dom.levelUpBanner.querySelector('.level-up-text').textContent = 'LEVEL UP! ' + lvl.label;
        spawnCoinBurst(10);
        setTimeout(function() {
            dom.levelUpBanner.style.display = 'none';
        }, 4000);
    } else {
        dom.levelUpBanner.style.display = 'none';
    }
}
