import { ForensicIncident } from "./packet-store";

export function exportIncidentsToCsv(incidents: ForensicIncident[]) {
  if (!incidents || incidents.length === 0) return;

  const headers = [
    "Incident ID",
    "Timestamp",
    "Severity",
    "Threat Type",
    "Action Taken",
    "Attacker IP",
    "Method",
    "Signed In As",
    "Request URI",
    "Payload Match",
    "User Agent",
  ];

  const escapeCsv = (val: string) => {
    if (!val) return '""';
    const clean = String(val).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = incidents.map((inc) => [
    escapeCsv(inc.id),
    escapeCsv(inc.recorded),
    escapeCsv(inc.severity),
    escapeCsv(inc.type),
    escapeCsv(inc.action_taken),
    escapeCsv(inc.attacker_ip),
    escapeCsv(inc.method),
    escapeCsv(inc.signed_in_as),
    escapeCsv(inc.request_uri),
    escapeCsv(inc.payload_match),
    escapeCsv(inc.user_agent),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `fluxwall_forensic_incidents_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportIncidentsToPdf(incidents: ForensicIncident[]) {
  if (!incidents || incidents.length === 0) return;

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL").length;
  const uniqueIps = new Set(incidents.map((i) => i.attacker_ip)).size;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FluxWall SOC Security Incident Audit Report</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 12px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .logo-title {
      font-size: 22px;
      font-weight: 900;
      color: #0284c7;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 800;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-critical { background: #fee2e2; color: #dc2626; border: 1px solid #f87171; }
    .badge-banned { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; }
    .meta-box {
      font-size: 11px;
      color: #64748b;
      text-align: right;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 25px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .metric-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .metric-value { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 8px 10px;
      font-weight: 700;
      border-bottom: 2px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 9px;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) { background: #f8fafc; }
    .code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      color: #0284c7;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-title">FLUXWALL CYBER DEFENSE</div>
      <div style="font-size: 12px; color: #64748b; font-weight: 600;">SOC Incident Forensics & Threat Audit Report</div>
    </div>
    <div class="meta-box">
      <div><strong>Report Generated:</strong> ${new Date().toISOString().replace("T", " ").substring(0, 19)} UTC</div>
      <div><strong>Security Status:</strong> <span class="badge badge-critical">ENFORCED</span></div>
      <div><strong>System:</strong> FluxWall Gateway v1.0.4</div>
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Total Recorded Incidents</div>
      <div class="metric-value">${totalIncidents}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Critical Severity Threats</div>
      <div class="metric-value" style="color: #dc2626;">${criticalCount}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Unique Attacker IPs Neutralized</div>
      <div class="metric-value" style="color: #0284c7;">${uniqueIps}</div>
    </div>
  </div>

  <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; border-left: 3px solid #0284c7; padding-left: 8px;">
    Neutralized Incident Forensics Dossier
  </h3>

  <table>
    <thead>
      <tr>
        <th>Incident ID</th>
        <th>Timestamp</th>
        <th>Severity</th>
        <th>Type</th>
        <th>Attacker IP</th>
        <th>Target URI</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${incidents
        .map(
          (inc) => `
      <tr>
        <td style="font-weight: 800; font-family: monospace;">${inc.id}</td>
        <td style="font-family: monospace; color: #64748b;">${inc.recorded}</td>
        <td><span class="badge badge-critical">${inc.severity}</span></td>
        <td style="font-weight: 600;">${inc.type}</td>
        <td class="code" style="font-weight: 700;">${inc.attacker_ip}</td>
        <td class="code">${inc.request_uri}</td>
        <td><span class="badge badge-banned">${inc.action_taken}</span></td>
      </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <div>FluxWall Enterprise SOC Security Platform &copy; ${new Date().getFullYear()}</div>
    <div>Confidential Security Audit Dossier &bull; Auto-Generated Cryptographic Log</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
