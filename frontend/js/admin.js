/**
 * CLASSIC NET - Admin Dashboard Logic
 */

const API_BASE_URL = window.API_BASE_URL || "/api";

// Check Auth
const token = localStorage.getItem("classicnet_admin_token");
if (!token && !window.location.href.includes("login.html")) {
  window.location.href = "login.html";
}

let currentTab = "dashboard";

document.addEventListener("DOMContentLoaded", () => {
  loadAdminUser();
  loadDashboardData();
  setupNavigation();
});

function loadAdminUser() {
  const userStr = localStorage.getItem("classicnet_admin_user");
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      const nameEl = document.getElementById("adminFullName");
      if (nameEl) nameEl.innerText = u.name || u.username;
    } catch (e) {}
  }
}

function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-content").forEach(el => {
    el.style.display = el.id === `tab-${tab}` ? "block" : "none";
  });

  if (tab === "dashboard") loadDashboardData();
  else if (tab === "bundles") loadBundles();
  else if (tab === "customers") loadCustomers();
  else if (tab === "transactions") loadTransactions();
  else if (tab === "vouchers") loadVouchers();
  else if (tab === "mikrotik") loadMikroTik();
  else if (tab === "settings") loadSettings();
}

function logout() {
  localStorage.removeItem("classicnet_admin_token");
  localStorage.removeItem("classicnet_admin_user");
  window.location.href = "login.html";
}

// 1. Dashboard Metrics
async function loadDashboardData() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.metrics) {
      const m = data.metrics;
      document.getElementById("statTotalRevenue").innerText = `TSH ${Number(m.total_revenue).toLocaleString()}`;
      document.getElementById("statTotalCustomers").innerText = m.total_customers;
      document.getElementById("statActiveCustomers").innerText = m.active_customers;
      document.getElementById("statExpiredCustomers").innerText = m.expired_customers;
      document.getElementById("statTotalTxns").innerText = m.total_transactions;
      document.getElementById("statSuccessTxns").innerText = m.successful_payments;
      document.getElementById("statFailedTxns").innerText = m.failed_payments;
      document.getElementById("statPendingTxns").innerText = m.pending_payments;
      document.getElementById("statActiveVouchers").innerText = m.active_vouchers;

      renderRevenueBars(data.charts?.daily_revenue || []);
      renderNetworkShare(data.charts?.network_distribution || []);
    }
  } catch (e) {
    console.error("Failed to load dashboard metrics:", e);
  }
}

function renderRevenueBars(dailyData) {
  const container = document.getElementById("revenueChartBars");
  if (!container) return;
  const max = Math.max(...dailyData.map(d => d.amount), 1);

  container.innerHTML = dailyData.map(d => {
    const heightPct = Math.round((d.amount / max) * 100);
    return `
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
        <div style="font-size:11px; font-weight:700; color:#0284c7; margin-bottom:4px;">${Math.round(d.amount/1000)}k</div>
        <div style="width:100%; max-width:36px; height:${heightPct}%; background:#0284c7; border-radius:4px 4px 0 0; min-height:4px;"></div>
        <div style="font-size:11px; color:#64748b; margin-top:6px;">${d.date}</div>
      </div>
    `;
  }).join("");
}

function renderNetworkShare(networks) {
  const container = document.getElementById("networkDistributionList");
  if (!container) return;
  const total = networks.reduce((acc, curr) => acc + curr.count, 0) || 1;

  container.innerHTML = networks.map(n => {
    const pct = Math.round((n.count / total) * 100);
    return `
      <div style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:4px;">
          <span>${n.network}</span>
          <span>${n.count} customers (${pct}%)</span>
        </div>
        <div style="width:100%; background:#e2e8f0; height:8px; border-radius:9999px; overflow:hidden;">
          <div style="width:${pct}%; background:${n.color}; height:100%;"></div>
        </div>
      </div>
    `;
  }).join("");
}

// 2. Bundles
async function loadBundles() {
  const table = document.getElementById("bundlesTableBody");
  if (!table) return;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/bundles`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.bundles) {
      table.innerHTML = data.bundles.map(b => `
        <tr>
          <td><strong>${b.name}</strong></td>
          <td>TSH ${Number(b.price_tsh).toLocaleString()}</td>
          <td>${b.duration_label || (b.duration_hours + ' Hours')}</td>
          <td><span class="badge ${b.is_unlimited ? 'badge-green' : 'badge-yellow'}">${b.is_unlimited ? 'Unlimited' : 'Limited'}</span></td>
          <td>${b.is_active ? '<span style="color:#16a34a; font-weight:700;">● Active</span>' : '<span style="color:#94a3b8;">Inactive</span>'}</td>
          <td>
            <button class="action-btn" onclick="editBundleModal(${b.id}, '${b.name}', ${b.price_tsh}, ${b.duration_hours}, '${b.duration_label}', ${b.is_unlimited})">Edit</button>
            <button class="action-btn danger" onclick="deleteBundle(${b.id})">Delete</button>
          </td>
        </tr>
      `).join("");
    }
  } catch (e) {
    console.error("Bundle load error:", e);
  }
}

// 3. Customers
async function loadCustomers() {
  const table = document.getElementById("customersTableBody");
  if (!table) return;
  const search = document.getElementById("customerSearchInput")?.value || "";

  try {
    const res = await fetch(`${API_BASE_URL}/admin/customers?search=${encodeURIComponent(search)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.customers) {
      table.innerHTML = data.customers.map(c => `
        <tr>
          <td>#${c.id}</td>
          <td><strong>${c.phone}</strong></td>
          <td><span class="net-tag">${c.network}</span></td>
          <td>${c.bundle}</td>
          <td>TSH ${Number(c.amount).toLocaleString()}</td>
          <td><span class="badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}">${c.status}</span></td>
          <td style="font-size:12px; color:#64748b;">${c.activation_time}</td>
          <td style="font-size:12px; color:#0f172a; font-weight:600;">${c.expiry_time}</td>
          <td style="font-family:monospace; font-size:12px;">${c.mac || '-'}</td>
        </tr>
      `).join("");
    }
  } catch (e) {
    console.error("Failed to load customers:", e);
  }
}

// 4. Transactions
async function loadTransactions() {
  const table = document.getElementById("transactionsTableBody");
  if (!table) return;
  const search = document.getElementById("txnSearchInput")?.value || "";

  try {
    const res = await fetch(`${API_BASE_URL}/admin/transactions?search=${encodeURIComponent(search)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.transactions) {
      table.innerHTML = data.transactions.map(t => `
        <tr>
          <td><code>${t.txn_id}</code></td>
          <td><strong>${t.phone}</strong></td>
          <td><span class="net-tag">${t.network}</span></td>
          <td>${t.bundle}</td>
          <td>TSH ${Number(t.amount).toLocaleString()}</td>
          <td>
            <span class="badge ${t.payment_status === 'SUCCESS' ? 'badge-green' : (t.payment_status === 'PENDING' ? 'badge-yellow' : 'badge-red')}">
              ${t.payment_status}
            </span>
          </td>
          <td><span class="badge ${t.activation_status === 'ACTIVATED' ? 'badge-green' : 'badge-gray'}">${t.activation_status}</span></td>
          <td style="font-size:12px; color:#64748b;">${t.created_at}</td>
          <td style="font-size:12px; font-family:monospace;">${t.azampay_ref || '-'}</td>
        </tr>
      `).join("");
    }
  } catch (e) {
    console.error("Transactions load error:", e);
  }
}

// 5. Vouchers
async function loadVouchers() {
  const table = document.getElementById("vouchersTableBody");
  if (!table) return;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/vouchers`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.vouchers) {
      table.innerHTML = data.vouchers.map(v => `
        <tr>
          <td><strong style="font-family:monospace; font-size:15px; color:#0284c7; letter-spacing:1px;">${v.code}</strong></td>
          <td>${v.bundle_name}</td>
          <td>TSH ${Number(v.price_tsh).toLocaleString()}</td>
          <td><span class="badge ${v.status === 'UNUSED' ? 'badge-green' : 'badge-gray'}">${v.status}</span></td>
          <td>${v.used_by_phone || '-'}</td>
          <td style="font-size:12px; color:#64748b;">${v.created_at || '-'}</td>
        </tr>
      `).join("");
    }
  } catch (e) {
    console.error("Vouchers load error:", e);
  }
}

// Generate Vouchers
async function handleGenerateVouchers() {
  const bundleId = document.getElementById("voucherBundleSelect").value;
  const qty = document.getElementById("voucherQuantityInput").value;

  try {
    const res = await fetch(`${API_BASE_URL}/admin/vouchers/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ bundle_id: parseInt(bundleId), quantity: parseInt(qty) })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Success: ${data.message}`);
      loadVouchers();
    }
  } catch (e) {
    alert("Voucher generation failed: " + e.message);
  }
}

// 6. MikroTik
async function loadMikroTik() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/mikrotik/status`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.router) {
      const r = data.router;
      document.getElementById("mtStatus").innerText = r.status;
      document.getElementById("mtHost").innerText = `${r.host}:${r.port}`;
      document.getElementById("mtHotspot").innerText = r.hotspot_server;
      document.getElementById("mtModel").innerText = `${r.model} (${r.routeros_version})`;
      document.getElementById("mtCpu").innerText = r.cpu_load;
      document.getElementById("mtMemory").innerText = r.free_memory;
      document.getElementById("mtActiveCount").innerText = r.active_hotspot_users;

      const sessionsTable = document.getElementById("mtSessionsBody");
      if (sessionsTable && data.sessions) {
        sessionsTable.innerHTML = data.sessions.map(s => `
          <tr>
            <td><strong>${s.user}</strong></td>
            <td>${s.address}</td>
            <td style="font-family:monospace;">${s.mac_address}</td>
            <td>${s.uptime}</td>
            <td style="font-size:12px;">↓ ${Math.round(s.bytes_out / (1024*1024))} MB / ↑ ${Math.round(s.bytes_in / (1024*1024))} MB</td>
            <td><button class="action-btn danger" onclick="disconnectUser('${s.user}')">Disconnect</button></td>
          </tr>
        `).join("");
      }
    }
  } catch (e) {
    console.error("MikroTik status load error:", e);
  }
}

// 7. Settings
async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      document.getElementById("setSystemName").value = s.system_name || "CLASSIC NET";
      document.getElementById("setSlogan").value = s.slogan || "Fast • Simple • Reliable Internet";
      document.getElementById("setSupportPhone").value = s.support_phone || "0618781830";
      document.getElementById("setSupportEmail").value = s.support_email || "jacksonribent53@gmail.com";
      document.getElementById("setCurrency").value = s.currency || "TSH";
      document.getElementById("setMtHost").value = s.mikrotik_host || "192.168.88.1";
    }
  } catch (e) {
    console.error("Settings load error:", e);
  }
}
