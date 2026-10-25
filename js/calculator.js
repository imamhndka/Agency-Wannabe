// JADI.in Hub — calculator.js
// MARGIN CALCULATOR
function populateCalculatorVendorDropdown() {
    const select = document.getElementById('calc-quick-vendor');
    select.innerHTML = `<option value="">${t('calcManualOption')}</option>`;
    vendors.forEach(v => { select.innerHTML += `<option value="vendor_${v.id}">Vendor: ${esc(v.name)} - ${formatIDR(v.cost)}</option>`; });
}

function autoFillCalcFromVendor() {
    const val = document.getElementById('calc-quick-vendor').value;
    if (!val) return;
    if (val.startsWith('vendor_')) {
        const v = vendors.find(item => item.id === val.replace('vendor_', ''));
        if (v && v.cost) {
            document.getElementById('calc-vendor-cost').value = v.cost;
            updateCalculator();
        }
    }
}

function updateCalculator() {
    const vendorCost = Number(document.getElementById('calc-vendor-cost').value) || 0;
    const bufferPercent = Number(document.getElementById('calc-buffer-percent').value) || 0;
    const overheadPercent = Number(document.getElementById('calc-overhead-percent').value) || 0;
    const targetMarginPercent = Number(document.getElementById('calc-target-margin').value) || 0;

    document.getElementById('calc-vendor-val-display').innerText = formatIDR(vendorCost);
    document.getElementById('calc-buffer-val-display').innerText = `${bufferPercent}%`;
    document.getElementById('calc-overhead-val-display').innerText = `${overheadPercent}%`;
    document.getElementById('calc-margin-val-display').innerText = `${targetMarginPercent}%`;

    const bufferCost = vendorCost * (bufferPercent / 100);
    const breakevenPrice = vendorCost + bufferCost + ((vendorCost + bufferCost) * (overheadPercent / 100));
    const recommendedQuote = targetMarginPercent < 100 ? breakevenPrice / (1 - (targetMarginPercent / 100)) : breakevenPrice * 2;
    const netProfit = recommendedQuote - breakevenPrice;

    document.getElementById('calc-recommended-quote').innerText = formatIDR(recommendedQuote);
    document.getElementById('calc-net-profit-val').innerText = formatIDR(netProfit);
    document.getElementById('calc-breakeven-val').innerText = formatIDR(breakevenPrice);
}

function convertCalcToProjectModal() {
    const quoteText = document.getElementById('calc-recommended-quote').innerText;
    const vendorCost = Number(document.getElementById('calc-vendor-cost').value);
    openProjectModal();
    document.getElementById('proj-revenue').value = Number(quoteText.replace(/[^0-9]/g, ''));
    document.getElementById('proj-cost').value = vendorCost;
}

function applyPreset(type) {
    if (type === 'landing-page') {
        document.getElementById('calc-vendor-cost').value = 4500000;
        document.getElementById('calc-buffer-percent').value = 10;
        document.getElementById('calc-overhead-percent').value = 15;
        document.getElementById('calc-target-margin').value = 45;
    } else if (type === 'social-media') {
        document.getElementById('calc-vendor-cost').value = 6000000;
        document.getElementById('calc-buffer-percent').value = 5;
        document.getElementById('calc-overhead-percent').value = 15;
        document.getElementById('calc-target-margin').value = 40;
    } else if (type === 'video-editing') {
        document.getElementById('calc-vendor-cost').value = 3000000;
        document.getElementById('calc-buffer-percent').value = 10;
        document.getElementById('calc-overhead-percent').value = 10;
        document.getElementById('calc-target-margin').value = 50;
    } else if (type === 'brand-identity') {
        document.getElementById('calc-vendor-cost').value = 5000000;
        document.getElementById('calc-buffer-percent').value = 15;
        document.getElementById('calc-overhead-percent').value = 15;
        document.getElementById('calc-target-margin').value = 50;
    }
    updateCalculator();
    showToast("Preset loaded");
}
