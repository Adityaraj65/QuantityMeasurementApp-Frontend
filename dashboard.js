const API_BASE = "http://localhost:8080/api/v1/quantities";
const UNITS = {
    LengthUnit: ["FEET", "INCHES", "YARDS", "CENTIMETERS"],
    VolumeUnit: ["LITRE", "MILLILITRE", "GALLON"],
    WeightUnit: ["KILOGRAM", "GRAM", "POUND"],
    TemperatureUnit: ["CELSIUS", "FAHRENHEIT", "KELVIN"]
};

// Application State
let currentType = "LengthUnit";
let currentOp = "compare";

// DOM Elements
const unit1Select = document.getElementById('unit1');
const unit2Select = document.getElementById('unit2');
const val2Input = document.getElementById('val2');
const mathRow = document.getElementById('mathSelect');
const resultDiv = document.getElementById('result');
const opSymbol = document.getElementById('opSymbol');
const navAuthBtn = document.getElementById('navAuthBtn');

/**
 * Initializes/Updates unit dropdowns based on category selection
 */
function updateUnitDropdowns() {
    const options = UNITS[currentType].map(u => `<option value="${u}">${u}</option>`).join('');
    unit1Select.innerHTML = options;
    unit2Select.innerHTML = options;
}

/**
 * Handles Category Selection (Length, Volume, etc.)
 */
document.querySelectorAll('.cat-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelector('.cat-item.active').classList.remove('active');
        e.target.classList.add('active');
        currentType = e.target.dataset.type;
        updateUnitDropdowns();
    });
});

/**
 * Handles Tab Selection (Compare, Convert, Arithmetic)
 */
document.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelector('.tab-item.active').classList.remove('active');
        e.target.classList.add('active');
        currentOp = e.target.dataset.op;

        // Reset UI States
        val2Input.style.display = 'block'; 
        mathRow.classList.add('hidden');
        opSymbol.innerText = "VS";

        if (currentOp === 'convert') {
            val2Input.style.display = 'none'; // Hide numeric input, keep dropdown for Target Unit
            opSymbol.innerText = "TO";
        } else if (currentOp === 'arithmetic') {
            mathRow.classList.remove('hidden');
            opSymbol.innerText = "OP";
        }
    });
});

/**
 * Main Calculation Logic
 */
document.getElementById('calcBtn').addEventListener('click', async () => {
    const v1 = document.getElementById('val1').value;
    const v2 = val2Input.value;

    if (!v1) {
        resultDiv.innerText = "Enter a value first!";
        return;
    }

    // Determine correct endpoint
    let endpoint = `/${currentOp}`;
    if (currentOp === 'arithmetic') {
        endpoint = `/${document.getElementById('mathOp').value}`;
    }

    const payload = {
        firstQuantity: { value: parseFloat(v1), unit: unit1Select.value, measurementType: currentType },
        secondQuantity: { value: parseFloat(v2) || 0, unit: unit2Select.value, measurementType: currentType },
        targetUnit: unit2Select.value
    };

    try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.errorMessage || "Calculation failed");

        // UI Output Logic
        if (currentOp === 'compare') {
            resultDiv.innerText = data.resultString === "true" ? "MATCH ✅" : "NO MATCH ❌";
        } else {
            resultDiv.innerText = `${data.resultValue.toFixed(2)} ${unit2Select.value}`;
        }
    } catch (err) {
        console.error(err);
        resultDiv.innerText = "Error: " + err.message;
    }
});

/**
 * History Modal Logic
 */
document.getElementById('historyBtn').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Please Login to view your history.");
        return;
    }

    document.getElementById('historyOverlay').classList.remove('hidden');
    
    try {
        const res = await fetch(`${API_BASE}/history/type/${currentType}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await res.json();

        document.getElementById('historyBody').innerHTML = history.map(h => `
            <tr>
                <td><strong>${h.operation}</strong></td>
                <td>${h.thisValue}</td>
                <td>${h.operation === 'CONVERT' ? '-' : h.thatValue}</td>
                <td>${h.operation === 'COMPARE' ? h.resultString : h.resultValue.toFixed(2)}</td>
            </tr>
        `).join('');
    } catch (err) {
        alert("Could not load history. Session may have expired.");
    }
});

/**
 * Auth Button Toggle (Login vs Logout)
 */
function updateAuthUI() {
    const token = localStorage.getItem('token');
    if (token) {
        navAuthBtn.innerText = "Logout";
        navAuthBtn.onclick = () => {
            localStorage.clear();
            location.reload();
        };
    } else {
        navAuthBtn.innerText = "Login";
        navAuthBtn.onclick = () => window.location.href = "auth.html";
    }
}

// Initialization
updateUnitDropdowns();
updateAuthUI();