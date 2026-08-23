// AegisGuard Dashboard JavaScript Application
let adminApiKey = localStorage.getItem("aegis_admin_key") || "super-secret-admin-key-2026";
document.getElementById("api-key-input").value = adminApiKey;

// Setup Chart.js
const ctx = document.getElementById('qpsChart').getContext('2d');
const maxDataPoints = 30;
const chartLabels = Array(maxDataPoints).fill('');
const chartData = Array(maxDataPoints).fill(0);

const qpsChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: chartLabels,
        datasets: [{
            label: 'Global Requests / Sec',
            data: chartData,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        scales: {
            x: { display: false },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono' } }
            }
        },
        plugins: {
            legend: { display: false }
        }
    }
});

// Toast Notification Helper
function showToast(message, isError = false) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    toast.style.borderColor = isError ? '#f43f5e' : '#10b981';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Fetch wrapper with API key
async function apiFetch(url, options = {}) {
    options.headers = options.headers || {};
    options.headers["X-Admin-Key"] = adminApiKey;
    options.headers["Content-Type"] = "application/json";

    try {
        const resp = await fetch(url, options);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: resp.statusText }));
            throw new Error(err.message || err.error || "Request failed");
        }
        return await resp.json();
    } catch (err) {
        console.error(`[API Error] ${url}:`, err);
        throw err;
    }
}

// Fetch & Update Stats
async function updateStats() {
    try {
        const data = await apiFetch("/api/admin/stats");
        
        // Update values
        const qps = data.global_qps || 0;
        document.getElementById("val-qps").innerText = qps;
        document.getElementById("val-bans").innerText = data.counts.active_bans || 0;
        document.getElementById("val-whitelist").innerText = data.counts.whitelisted_ips || 0;
        document.getElementById("val-blacklist").innerText = data.counts.blacklisted_ips || 0;

        // Update surge badge
        const badge = document.getElementById("surge-badge");
        const surgeText = document.getElementById("surge-text");
        if (data.surge_mode && data.surge_mode.active) {
            badge.className = "badge badge-surge";
            surgeText.innerText = "SURGE DEFENSE ACTIVE (-50% Limit)";
        } else {
            badge.className = "badge badge-normal";
            surgeText.innerText = "Traffic: Normal";
        }

        // Update Chart
        chartData.push(qps);
        chartData.shift();
        qpsChart.update();
    } catch (err) {
        // Suppress toast spam during periodic fetch errors
    }
}

// Fetch & Render Tables
async function updateTables() {
    // 1. Bans Table
    try {
        const data = await apiFetch("/api/admin/bans");
        const tbody = document.getElementById("table-bans-body");
        const countSpan = document.getElementById("count-tab-bans");
        countSpan.innerText = data.count || 0;

        if (data.bans && data.bans.length > 0) {
            tbody.innerHTML = data.bans.map(item => `
                <tr>
                    <td class="text-rose"><strong>${item.ip}</strong></td>
                    <td>${item.reason}</td>
                    <td>${item.ttl_seconds}s</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="unbanIp('${item.ip}')">Unban</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No active temporary bans.</td></tr>`;
        }
    } catch (err) {}

    // 2. Whitelist Table
    try {
        const data = await apiFetch("/api/admin/whitelist");
        const tbody = document.getElementById("table-wl-body");
        const countSpan = document.getElementById("count-tab-wl");
        countSpan.innerText = data.count || 0;

        if (data.whitelist && data.whitelist.length > 0) {
            tbody.innerHTML = data.whitelist.map(ip => `
                <tr>
                    <td class="text-emerald"><strong>${ip}</strong></td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="removeWhitelist('${ip}')">Remove</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted">No whitelisted IPs.</td></tr>`;
        }
    } catch (err) {}

    // 3. Blacklist Table
    try {
        const data = await apiFetch("/api/admin/blacklist");
        const tbody = document.getElementById("table-bl-body");
        const countSpan = document.getElementById("count-tab-bl");
        countSpan.innerText = data.count || 0;

        if (data.blacklist && data.blacklist.length > 0) {
            tbody.innerHTML = data.blacklist.map(ip => `
                <tr>
                    <td class="text-amber"><strong>${ip}</strong></td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="removeBlacklist('${ip}')">Remove</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted">No blacklisted IPs.</td></tr>`;
        }
    } catch (err) {}
}

// Action Helpers
window.unbanIp = async function(ip) {
    try {
        await apiFetch(`/api/admin/bans?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
        showToast(`IP ${ip} unbanned successfully`);
        updateTables();
        updateStats();
    } catch (err) {
        showToast(`Failed to unban: ${err.message}`, true);
    }
};

window.removeWhitelist = async function(ip) {
    try {
        await apiFetch(`/api/admin/whitelist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
        showToast(`IP ${ip} removed from whitelist`);
        updateTables();
        updateStats();
    } catch (err) {
        showToast(`Failed: ${err.message}`, true);
    }
};

window.removeBlacklist = async function(ip) {
    try {
        await apiFetch(`/api/admin/blacklist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
        showToast(`IP ${ip} removed from blacklist`);
        updateTables();
        updateStats();
    } catch (err) {
        showToast(`Failed: ${err.message}`, true);
    }
};

// Form Event Listeners
document.getElementById("form-ban").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ip = document.getElementById("ban-ip").value.trim();
    const duration_sec = parseInt(document.getElementById("ban-duration").value) || 900;
    const reason = document.getElementById("ban-reason").value.trim();

    try {
        await apiFetch("/api/admin/bans", {
            method: "POST",
            body: JSON.stringify({ ip, duration_sec, reason })
        });
        showToast(`IP ${ip} banned for ${duration_sec}s`);
        document.getElementById("ban-ip").value = "";
        updateTables();
        updateStats();
    } catch (err) {
        showToast(err.message, true);
    }
});

document.getElementById("form-whitelist").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ip = document.getElementById("wl-ip").value.trim();
    try {
        await apiFetch("/api/admin/whitelist", {
            method: "POST",
            body: JSON.stringify({ ip })
        });
        showToast(`IP ${ip} whitelisted`);
        document.getElementById("wl-ip").value = "";
        updateTables();
        updateStats();
    } catch (err) {
        showToast(err.message, true);
    }
});

document.getElementById("form-blacklist").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ip = document.getElementById("bl-ip").value.trim();
    try {
        await apiFetch("/api/admin/blacklist", {
            method: "POST",
            body: JSON.stringify({ ip })
        });
        showToast(`IP ${ip} permanently blacklisted`);
        document.getElementById("bl-ip").value = "";
        updateTables();
        updateStats();
    } catch (err) {
        showToast(err.message, true);
    }
});

// Save Admin Key
document.getElementById("btn-save-key").addEventListener("click", () => {
    adminApiKey = document.getElementById("api-key-input").value.trim();
    localStorage.setItem("aegis_admin_key", adminApiKey);
    showToast("Admin API Key saved!");
    updateStats();
    updateTables();
});

document.getElementById("btn-refresh").addEventListener("click", () => {
    updateStats();
    updateTables();
    showToast("Data refreshed!");
});

// Tab Switcher
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

// Periodic Polling
setInterval(updateStats, 1000);   // Live QPS chart every second
setInterval(updateTables, 3000);  // Tables every 3 seconds

// Initial Load
updateStats();
updateTables();
