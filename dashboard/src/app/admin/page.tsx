"use client";

import React from "react";
import dynamic from "next/dynamic";
import ConfirmDialog from "@/components/confirm-dialog";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

// Layout Shell Components
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminHeader from "@/components/admin/admin-header";
import EmergencyBanners from "@/components/admin/emergency-banners";

// Modular Views
import OverviewView from "@/components/views/overview-view";
import AnalyticsView from "@/components/views/analytics-view";
import SimulatorView from "@/components/views/simulator-view";
import CustomWafView from "@/components/views/custom-waf-view";
import UpstreamsView from "@/components/views/upstreams-view";
import SslView from "@/components/views/ssl-view";
import IpLookupView from "@/components/views/ip-lookup-view";
import UsersView from "@/components/views/users-view";
import ProfileView from "@/components/views/profile-view";
import BansView from "@/components/views/bans-view";
import WhitelistView from "@/components/views/whitelist-view";
import BlacklistView from "@/components/views/blacklist-view";
import GeoIpView from "@/components/views/geoip-view";
import WafSignaturesView from "@/components/views/waf-signatures-view";
import RateLimitsView from "@/components/views/rate-limits-view";
import LogsView from "@/components/views/logs-view";
import MaintenanceView from "@/components/views/maintenance-view";
import DiagnosticsModal from "@/components/views/diagnostics-modal";

// Async SOC Visual Modules
const CyberThreatMap = dynamic(() => import("@/components/charts/cyber-threat-map"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center bg-secondary/10 rounded-2xl border border-primary/20 animate-pulse">
      <span className="text-xs text-muted-foreground font-mono">Initializing Cyber Threat Map Canvas...</span>
    </div>
  ),
});

const IncidentForensics = dynamic(() => import("@/components/incident-forensics"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center bg-secondary/10 rounded-2xl border border-primary/20 animate-pulse">
      <span className="text-xs text-muted-foreground font-mono">Loading Incident Forensics SOC Canvas...</span>
    </div>
  ),
});

const PacketInspector = dynamic(() => import("@/components/packet-inspector"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center bg-secondary/10 rounded-2xl border border-primary/20 animate-pulse">
      <span className="text-xs text-muted-foreground font-mono">Connecting to Live Packet Stream...</span>
    </div>
  ),
});

export default function EnterpriseAdminDashboard() {
  const d = useAdminDashboard();

  return (
    <div className="flex min-h-screen bg-[#080b11] text-foreground bg-grid-cyber">
      {/* Action Confirmation Modal Dialog */}
      <ConfirmDialog
        isOpen={d.confirmDialog.isOpen}
        title={d.confirmDialog.title}
        message={d.confirmDialog.message}
        variant={d.confirmDialog.variant}
        confirmLabel={d.confirmDialog.confirmLabel}
        onConfirm={d.confirmDialog.onConfirm}
        onCancel={() => d.setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* 1. Sidebar (Desktop & Mobile) */}
      <AdminSidebar
        t={d.t}
        currentNav={d.currentNav}
        mobileMenuOpen={d.mobileMenuOpen}
        setMobileMenuOpen={d.setMobileMenuOpen}
        handleNavSelect={d.handleNavSelect}
        collapsedSections={d.collapsedSections}
        toggleSection={d.toggleSection}
        handleLogout={d.handleLogout}
        liveLogs={d.liveLogs}
        bans={d.bans}
        whitelist={d.whitelist}
        blacklist={d.blacklist}
        blockedCountries={d.blockedCountries}
        customWafRules={d.customWafRules}
        upstreams={d.upstreams}
        sslDomains={d.sslDomains}
        adminUsers={d.adminUsers}
      />

      {/* 2. Main Work Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          t={d.t}
          lang={d.lang}
          currentNav={d.currentNav}
          underAttackMode={d.underAttackMode}
          health={d.health}
          setMobileMenuOpen={d.setMobileMenuOpen}
          changeLanguage={d.changeLanguage}
          toggleUnderAttackMode={d.toggleUnderAttackMode}
          fetchHealth={d.fetchHealth}
          setShowHealthModal={d.setShowHealthModal}
        />

        <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* Emergency Alert Banners */}
          <EmergencyBanners
            t={d.t}
            underAttackMode={d.underAttackMode}
            surgeMode={d.stats.surge_mode}
          />

          {/* VIEW: OVERVIEW & TELEMETRY */}
          {d.currentNav === "overview" && (
            <OverviewView
              stats={d.stats}
              t={d.t}
              chartLabels={d.chartLabels}
              chartPoints={d.chartPoints}
              banIp={d.banIp}
              setBanIp={d.setBanIp}
              banDuration={d.banDuration}
              setBanDuration={d.setBanDuration}
              handleManualBan={d.handleManualBan}
            />
          )}

          {/* VIEW: INCIDENT FORENSICS & CANARY DECOY TRAPS */}
          {d.currentNav === "forensics" && (
            <div className="space-y-6">
              <IncidentForensics />
            </div>
          )}

          {/* VIEW: CYBER THREAT MAP */}
          {d.currentNav === "threat_map" && (
            <div className="space-y-6">
              <CyberThreatMap />
            </div>
          )}

          {/* VIEW: LIVE PACKET STREAM & SNIFFER */}
          {d.currentNav === "packet_stream" && (
            <div className="space-y-6">
              <PacketInspector />
            </div>
          )}

          {/* VIEW: THREAT ANALYTICS */}
          {d.currentNav === "analytics" && (
            <AnalyticsView
              t={d.t}
              threatVectorData={d.threatVectorData}
              topCountriesData={d.topCountriesData}
            />
          )}

          {/* VIEW: DDOS ATTACK SIMULATOR SANDBOX */}
          {d.currentNav === "simulator" && (
            <SimulatorView
              t={d.t}
              simVector={d.simVector}
              setSimVector={d.setSimVector}
              simIntensity={d.simIntensity}
              setSimIntensity={d.setSimIntensity}
              simRunning={d.simRunning}
              handleLaunchSimulation={d.handleLaunchSimulation}
              simReport={d.simReport}
            />
          )}

          {/* VIEW: CUSTOM WAF RULE BUILDER */}
          {d.currentNav === "custom_waf" && (
            <CustomWafView
              t={d.t}
              customWafRules={d.customWafRules}
              ruleName={d.ruleName}
              setRuleName={d.setRuleName}
              ruleField={d.ruleField}
              setRuleField={d.setRuleField}
              ruleOp={d.ruleOp}
              setRuleOp={d.setRuleOp}
              ruleVal={d.ruleVal}
              setRuleVal={d.setRuleVal}
              ruleAction={d.ruleAction}
              setRuleAction={d.setRuleAction}
              handleCreateCustomRule={d.handleCreateCustomRule}
              handleDeleteCustomRule={d.handleDeleteCustomRule}
            />
          )}

          {/* VIEW: BACKEND UPSTREAM PROXIES */}
          {d.currentNav === "upstreams" && (
            <UpstreamsView
              t={d.t}
              upstreams={d.upstreams}
              newUpsHost={d.newUpsHost}
              setNewUpsHost={d.setNewUpsHost}
              newUpsPort={d.newUpsPort}
              setNewUpsPort={d.setNewUpsPort}
              newUpsProtocol={d.newUpsProtocol}
              setNewUpsProtocol={d.setNewUpsProtocol}
              newUpsWeight={d.newUpsWeight}
              setNewUpsWeight={d.setNewUpsWeight}
              handleAddUpstream={d.handleAddUpstream}
              handleDeleteUpstream={d.handleDeleteUpstream}
            />
          )}

          {/* VIEW: SSL & DOMAINS */}
          {d.currentNav === "ssl" && (
            <SslView
              t={d.t}
              sslDomains={d.sslDomains}
              newDomain={d.newDomain}
              setNewDomain={d.setNewDomain}
              newIssuer={d.newIssuer}
              setNewIssuer={d.setNewIssuer}
              handleAddDomain={d.handleAddDomain}
              handleDeleteDomain={d.handleDeleteDomain}
              handleToggleSslFlag={d.handleToggleSslFlag}
              handleIssueLetsEncrypt={d.handleIssueLetsEncrypt}
            />
          )}

          {/* VIEW: IP INTELLIGENCE LOOKUP */}
          {d.currentNav === "lookup" && (
            <IpLookupView
              t={d.t}
              lang={d.lang}
              lookupTargetIp={d.lookupTargetIp}
              setLookupTargetIp={d.setLookupTargetIp}
              lookupResult={d.lookupResult}
              lookupLoading={d.lookupLoading}
              handleExecuteLookup={d.handleExecuteLookup}
              handleUnban={d.handleUnban}
              openConfirm={d.openConfirm}
              showToast={d.showToast}
            />
          )}

          {/* VIEW: ADMIN USER MANAGEMENT */}
          {d.currentNav === "users" && (
            <UsersView
              t={d.t}
              adminUsers={d.adminUsers}
              newUsername={d.newUsername}
              setNewUsername={d.setNewUsername}
              newUserPassword={d.newUserPassword}
              setNewUserPassword={d.setNewUserPassword}
              newUserRole={d.newUserRole}
              setNewUserRole={d.setNewUserRole}
              handleAddUser={d.handleAddUser}
              handleDeleteUser={d.handleDeleteUser}
            />
          )}

          {/* VIEW: SECURITY PROFILE & KEYS */}
          {d.currentNav === "profile" && (
            <ProfileView
              t={d.t}
              profileApiKey={d.profileApiKey}
              handleRegenerateApiKey={d.handleRegenerateApiKey}
              newPassword={d.newPassword}
              setNewPassword={d.setNewPassword}
              confirmPassword={d.confirmPassword}
              setConfirmPassword={d.setConfirmPassword}
              showApiKey={d.showApiKey}
              setShowApiKey={d.setShowApiKey}
              handleChangePassword={d.handleChangePassword}
              showToast={d.showToast}
            />
          )}

          {/* VIEW: IP QUARANTINE & BANS */}
          {d.currentNav === "bans" && (
            <BansView
              t={d.t}
              bans={d.bans}
              banIp={d.banIp}
              setBanIp={d.setBanIp}
              banDuration={d.banDuration}
              setBanDuration={d.setBanDuration}
              handleManualBan={d.handleManualBan}
              handleUnban={d.handleUnban}
            />
          )}

          {/* VIEW: WHITELIST */}
          {d.currentNav === "whitelist" && (
            <WhitelistView
              t={d.t}
              whitelist={d.whitelist}
              whitelistIp={d.whitelistIp}
              setWhitelistIp={d.setWhitelistIp}
              handleAddWhitelist={d.handleAddWhitelist}
              handleRemoveWhitelist={d.handleRemoveWhitelist}
            />
          )}

          {/* VIEW: BLACKLIST */}
          {d.currentNav === "blacklist" && (
            <BlacklistView
              t={d.t}
              blacklist={d.blacklist}
              blacklistIp={d.blacklistIp}
              setBlacklistIp={d.setBlacklistIp}
              handleAddBlacklist={d.handleAddBlacklist}
              handleRemoveBlacklist={d.handleRemoveBlacklist}
            />
          )}

          {/* VIEW: GEOIP COUNTRIES */}
          {d.currentNav === "geoip" && (
            <GeoIpView
              t={d.t}
              blockedCountries={d.blockedCountries}
              newCountryCode={d.newCountryCode}
              setNewCountryCode={d.setNewCountryCode}
              handleAddCountry={d.handleAddCountry}
              handleRemoveCountry={d.handleRemoveCountry}
            />
          )}

          {/* VIEW: WAF SIGNATURES */}
          {d.currentNav === "waf" && <WafSignaturesView t={d.t} />}

          {/* VIEW: RATE LIMIT SCALER */}
          {d.currentNav === "ratelimits" && (
            <RateLimitsView
              t={d.t}
              lang={d.lang}
              rateLimitGeneral={d.rateLimitGeneral}
              setRateLimitGeneral={d.setRateLimitGeneral}
              rateLimitBurst={d.rateLimitBurst}
              setRateLimitBurst={d.setRateLimitBurst}
              openConfirm={d.openConfirm}
              showToast={d.showToast}
            />
          )}

          {/* VIEW: ATTACK LOGS */}
          {d.currentNav === "logs" && (
            <LogsView
              t={d.t}
              liveLogs={d.liveLogs}
              exportLogsAsJson={d.exportLogsAsJson}
            />
          )}

          {/* VIEW: MAINTENANCE CONTROLS */}
          {d.currentNav === "maintenance" && (
            <MaintenanceView
              t={d.t}
              handleGatewayAction={d.handleGatewayAction}
            />
          )}
        </main>
      </div>

      {/* Terminus Health Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={d.showHealthModal}
        onClose={() => d.setShowHealthModal(false)}
        health={d.health}
        t={d.t}
      />
    </div>
  );
}
