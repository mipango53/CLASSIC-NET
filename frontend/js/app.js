/**
 * CLASSIC NET - Customer Captive Portal JavaScript
 */

const API_BASE_URL = window.API_BASE_URL || "/api";

let selectedBundleId = 1;
let selectedNetwork = "YAS";
let bundlesList = [];

// Initialize Portal
document.addEventListener("DOMContentLoaded", () => {
    loadBundles();
    setupPhoneInput();
    setupNetworkButtons();
});

// Load Dynamic Bundles from Backend
async function loadBundles() {
    const container = document.getElementById("bundleContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/bundles`);
        const data = await res.json();
        if (data.success && data.bundles) {
            bundlesList = data.bundles;
            renderBundles(bundlesList);
        }
    } catch (e) {
        console.warn("Using fallback bundle list:", e);
        renderBundles([
            { id: 1, name: "24 HOURS", price_tsh: 1000, duration_label: "24 Hours", badge_text: "Unlimited" },
            { id: 2, name: "WEEK", price_tsh: 6000, duration_label: "7 Days", badge_text: "Unlimited" },
            { id: 3, name: "MONTH", price_tsh: 22000, duration_label: "30 Days", badge_text: "Unlimited" }
        ]);
    }
}

function renderBundles(bundles) {
    const container = document.getElementById("bundleContainer");
    if (!container) return;

    container.innerHTML = bundles.map((b, idx) => `
        <div class="bundle-card ${b.id === selectedBundleId ? 'selected' : ''}" onclick="selectBundle(${b.id})" id="bundle-${b.id}">
            <div class="bundle-info">
                <div class="bundle-name">${b.name}</div>
                <div class="bundle-duration">${b.duration_label || b.name}</div>
                <span class="badge-unlimited">${b.badge_text || 'Unlimited'}</span>
            </div>
            <div class="bundle-price">
                <div class="price-val">TSH ${Number(b.price_tsh).toLocaleString()}</div>
                <div class="currency">Tanzanian Shillings</div>
            </div>
        </div>
    `).join("");
}

function selectBundle(id) {
    selectedBundleId = id;
    document.querySelectorAll(".bundle-card").forEach(el => el.classList.remove("selected"));
    const target = document.getElementById(`bundle-${id}`);
    if (target) target.classList.add("selected");
}

function setupNetworkButtons() {
    const buttons = document.querySelectorAll(".network-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedNetwork = btn.dataset.network;
        });
    });
}

function setupPhoneInput() {
    const phoneInput = document.getElementById("phoneInput");
    if (!phoneInput) return;

    phoneInput.addEventListener("input", (e) => {
        const val = e.target.value.replace(/\D/g, "");
        e.target.value = val;

        // Auto-detect network prefix
        if (val.length >= 3) {
            const prefix = val.substring(0, 3);
            let detected = null;
            if (["071", "065", "067", "077"].includes(prefix)) detected = "YAS";
            else if (["068", "069", "078"].includes(prefix)) detected = "AIRTEL";
            else if (["074", "075", "076"].includes(prefix)) detected = "VODACOM";
            else if (["061", "062"].includes(prefix)) detected = "HALOTEL";

            if (detected) {
                const targetBtn = document.querySelector(`.network-btn[data-network="${detected}"]`);
                if (targetBtn) {
                    document.querySelectorAll(".network-btn").forEach(b => b.classList.remove("selected"));
                    targetBtn.classList.add("selected");
                    selectedNetwork = detected;
                }
            }
        }
    });
}

// Payment Initiation
async function initiatePayment() {
    const phoneInput = document.getElementById("phoneInput");
    const payBtn = document.getElementById("payBtn");
    const phone = phoneInput ? phoneInput.value.trim() : "";

    if (!phone || phone.length < 10) {
        alert("Please enter a valid 10-digit phone number (e.g. 0712345678 or 0618781830).");
        if (phoneInput) phoneInput.focus();
        return;
    }

    if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerText = "Initiating USSD Push...";
    }

    try {
        const res = await fetch(`${API_BASE_URL}/payments/initiate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: phone,
                network: selectedNetwork,
                bundle_id: selectedBundleId
            })
        });

        const data = await res.json();

        if (data.success && data.transaction_uuid) {
            // Save state and redirect to payment status
            sessionStorage.setItem("classicnet_tx", JSON.stringify(data));
            window.location.href = `payment.html?txn=${encodeURIComponent(data.transaction_uuid)}`;
        } else {
            alert(data.error || data.message || "Failed to initiate payment. Please try again.");
            if (payBtn) {
                payBtn.disabled = false;
                payBtn.innerText = "PAY NOW";
            }
        }
    } catch (err) {
        console.error("Payment initiation error:", err);
        alert("Could not connect to payment server. Please verify network connection.");
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerText = "PAY NOW";
        }
    }
}

// Redeem Voucher Function
async function redeemVoucher() {
    const voucherInput = document.getElementById("voucherCodeInput");
    const phoneInput = document.getElementById("voucherPhoneInput");
    const btn = document.getElementById("redeemBtn");

    const code = voucherInput ? voucherInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";

    if (!code || !phone) {
        alert("Please enter both voucher code and your phone number.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerText = "Redeeming...";
    }

    try {
        const res = await fetch(`${API_BASE_URL}/vouchers/redeem`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: code, phone: phone })
        });

        const data = await res.json();
        if (data.success) {
            sessionStorage.setItem("classicnet_activation", JSON.stringify(data));
            window.location.href = `success.html?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phone)}`;
        } else {
            alert(data.error || "Invalid or already used voucher.");
            if (btn) {
                btn.disabled = false;
                btn.innerText = "ACTIVATE INTERNET";
            }
        }
    } catch (e) {
        alert("Failed to redeem voucher. Please check network connection.");
        if (btn) {
            btn.disabled = false;
            btn.innerText = "ACTIVATE INTERNET";
        }
    }
}
