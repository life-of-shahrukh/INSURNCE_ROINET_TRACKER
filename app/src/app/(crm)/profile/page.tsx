"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { fmtDate } from "@/lib/formatters";
import type {
  ProfilePosp,
  ProfileSalesTeam,
  ProfileTeamSummary,
  ProfileUser,
  RoleTeamBucket,
  TeamPerson,
} from "@/lib/api/profile-api";

// ── role → badge class + label ────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; cls: string }> = {
  SUPER_ADMIN:   { label: "Super Admin",       cls: "badge-hot"     },
  NATIONAL_HEAD: { label: "National Head",     cls: "badge-warm"    },
  ZH:            { label: "Zonal Head",        cls: "badge-warm"    },
  RH:            { label: "Regional Head",     cls: "badge-cold"    },
  ASM:           { label: "Area Sales Mgr",    cls: "badge-success" },
  DM:            { label: "District Manager",  cls: "badge-success" },
  POSP:          { label: "POSP Agent",        cls: "badge-muted"   },
};

const ORG_ROLE_META: Record<string, { label: string; cls: string }> = {
  SZH:         { label: "Super Zonal Head", cls: "badge-warm"    },
  ZH:          { label: "Zonal Head",       cls: "badge-warm"    },
  CH:          { label: "Cluster Head",     cls: "badge-cold"    },
  RH:          { label: "Regional Head",    cls: "badge-cold"    },
  ASSISTASM:   { label: "Asst. ASM",        cls: "badge-success" },
  ASM:         { label: "Area Sales Mgr",   cls: "badge-success" },
  CSP:         { label: "CSP",              cls: "badge-muted"   },
  CSF:         { label: "CSF",              cls: "badge-muted"   },
  CMF:         { label: "CMF",              cls: "badge-muted"   },
  POSP:        { label: "POSP",             cls: "badge-muted"   },
  NATIONAL_HEAD: { label: "National Head",  cls: "badge-warm"    },
};

function orgRoleMeta(role: string, fallbackLabel?: string) {
  const m = ORG_ROLE_META[role];
  if (m) return m;
  return { label: fallbackLabel ?? role, cls: "badge-muted" };
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  ACTIVE:   { label: "Active",   cls: "badge-success" },
  INACTIVE: { label: "Inactive", cls: "badge-hot"     },
  PENDING:  { label: "Pending",  cls: "badge-warm"    },
};

function roleMeta(role: string) {
  return ROLE_META[role] ?? { label: role, cls: "badge-muted" };
}
function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, cls: "badge-muted" };
}

// ── info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}): React.ReactElement {
  return (
    <div>
      <dt style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.3rem" }}>
        {label}
      </dt>
      <dd style={{ fontSize: "0.875rem", color: "#1e293b", fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all", margin: 0 }}>
        {value ?? <span style={{ color: "#94a3b8" }}>—</span>}
      </dd>
    </div>
  );
}

// ── cards ─────────────────────────────────────────────────────────────────────

function AccountCard({ user }: { user: ProfileUser }): React.ReactElement {
  const rm = roleMeta(user.role);
  const sm = statusMeta(user.status);
  return (
    <Card>
      <div style={{ padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", fontSize: "0.95rem", color: "#0f172a" }}>
          Account
        </h3>
        <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 1.5rem" }}>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Role"   value={<Badge label={rm.label} className={rm.cls} />} />
          <InfoRow label="Status" value={<Badge label={sm.label} className={sm.cls} />} />
          <InfoRow label="User ID" value={user.id} mono />
        </dl>
      </div>
    </Card>
  );
}

function PospCard({ posp }: { posp: ProfilePosp }): React.ReactElement {
  const activeMeta = posp.active
    ? { label: "Active",   cls: "badge-success" }
    : { label: "Inactive", cls: "badge-hot"     };

  return (
    <Card>
      <div style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>POSP Details</h3>
          <Badge label={activeMeta.label} className={activeMeta.cls} />
        </div>
        <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 1.5rem" }}>
          <InfoRow label="POSP Code"      value={posp.code} mono />
          <InfoRow label="Name"           value={posp.name} />
          <InfoRow label="Mobile"         value={posp.mobile} />
          <InfoRow label="Email"          value={posp.email} />
          <InfoRow label="Joined"         value={fmtDate(posp.joined)} />
          <InfoRow label="Residence State" value={posp.region} />
          {posp.gcdCode   && <InfoRow label="GCD Code"   value={posp.gcdCode}   mono />}
          {posp.externalId && <InfoRow label="External ID" value={posp.externalId} mono />}
          {posp.zoneId     && <InfoRow label="Zone"     value={posp.zoneId} />}
          {posp.regionId   && <InfoRow label="Region"   value={posp.regionId} />}
          {posp.areaId     && <InfoRow label="Area"     value={posp.areaId} />}
          {posp.districtId && <InfoRow label="District" value={posp.districtId} />}
        </dl>
      </div>
    </Card>
  );
}

function TeamCard({ team }: { team: ProfileSalesTeam }): React.ReactElement {
  const sm = statusMeta(team.status);
  return (
    <Card>
      <div style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>Team Member Details</h3>
          <Badge label={sm.label} className={sm.cls} />
        </div>
        <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 1.5rem" }}>
          <InfoRow label="Name"           value={team.name} />
          <InfoRow label="Employee Code"  value={team.employeeCode} mono />
          <InfoRow label="Designation"    value={team.designation} />
          <InfoRow label="Mobile"         value={team.mobile || null} />
          <InfoRow label="Email"          value={team.email} />
          <InfoRow label="Joining Date"   value={fmtDate(team.joiningDate)} />
          {team.territory  && <InfoRow label="Territory" value={team.territory} />}
          {team.zoneName   && <InfoRow label="Zone"      value={team.zoneName} />}
          {team.regionName && <InfoRow label="Region"    value={team.regionName} />}
          {team.areaName   && <InfoRow label="Area"      value={team.areaName} />}
        </dl>
      </div>
    </Card>
  );
}

function KpiTile({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div style={{
      flex: 1,
      minWidth: 100,
      padding: "0.75rem 1rem",
      background: "#f8fafc",
      borderRadius: 10,
      border: "1px solid #e2e8f0",
    }}>
      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: "0.2rem" }}>
        {label}
      </div>
    </div>
  );
}

function formatGeoLine(m: TeamPerson): string | null {
  const parts = [m.stateName, m.districtName, m.cityName].filter(
    (p): p is string => !!p && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

function personDisplayName(m: TeamPerson): string {
  if (m.code && m.code !== m.name) {
    return `${m.name} (${m.code})`;
  }
  return m.code ?? m.name;
}

function ReportsToLine({
  reportsTo,
}: {
  reportsTo: NonNullable<TeamPerson["reportsTo"]>;
}): React.ReactElement {
  const rm = orgRoleMeta(reportsTo.role, reportsTo.label);
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.4rem",
      flexWrap: "wrap",
      marginTop: "0.35rem",
      fontSize: "0.78rem",
      color: "#475569",
    }}>
      <span>Reports to:</span>
      <Badge label={rm.label} className={rm.cls} />
      <span style={{ fontWeight: 600, color: "#1e293b" }}>{reportsTo.name}</span>
      <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "0.72rem" }}>
        {reportsTo.id}
      </span>
    </div>
  );
}

function TeamPersonRow({ member }: { member: TeamPerson }): React.ReactElement {
  const rm = orgRoleMeta(member.role, member.label);
  const geo = formatGeoLine(member);

  return (
    <div
      style={{
        padding: "0.65rem 0.75rem",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        fontSize: "0.82rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
        <Badge label={rm.label} className={rm.cls} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "#1e293b" }}>
            {personDisplayName(member)}
          </div>
          {geo && (
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>
              {geo}
            </div>
          )}
          {member.reportsTo && <ReportsToLine reportsTo={member.reportsTo} />}
        </div>
      </div>
    </div>
  );
}

function PersonList({ members }: { members: TeamPerson[] }): React.ReactElement {
  if (members.length === 0) {
    return <div style={{ fontSize: "0.8rem", color: "#94a3b8", padding: "0.5rem 0" }}>No members in this role.</div>;
  }
  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      {members.map((m) => (
        <TeamPersonRow key={m.id} member={m} />
      ))}
    </div>
  );
}

function DownlineRoleRow({ bucket }: { bucket: RoleTeamBucket }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const canExpand = bucket.members.length > 0;

  return (
    <div style={{ borderBottom: "1px solid #e2e8f0" }}>
      <button
        type="button"
        onClick={() => canExpand && setOpen(!open)}
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 72px 88px 28px",
          gap: "0.5rem",
          alignItems: "center",
          padding: "0.65rem 0",
          border: "none",
          background: "transparent",
          cursor: canExpand ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1e293b" }}>{bucket.label}</span>
        <span style={{ fontSize: "0.85rem", color: "#64748b", textAlign: "center" }}>
          {bucket.directCount > 0 ? bucket.directCount : "—"}
        </span>
        <span style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 600, textAlign: "center" }}>
          {bucket.totalCount}
        </span>
        <span style={{ color: "#94a3b8", fontSize: "0.7rem" }}>
          {canExpand ? (open ? "▼" : "▶") : ""}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: "0.75rem", paddingLeft: "0.25rem" }}>
          <PersonList members={bucket.members} />
        </div>
      )}
    </div>
  );
}

function DownlineTeamCard({ summary }: { summary: Extract<ProfileTeamSummary, { mode: "downline" }> }): React.ReactElement {
  return (
    <Card>
      <div style={{ padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "0.35rem", fontSize: "0.95rem", color: "#0f172a" }}>
          Team / Hierarchy
        </h3>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>
          People in your territory, grouped by org role.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <KpiTile label="Districts" value={summary.districtCount} />
          <KpiTile label="Managers" value={summary.managerCount} />
          <KpiTile label="POSPs" value={summary.pospCount} />
        </div>

        {summary.roles.length === 0 ? (
          <div style={{ fontSize: "0.85rem", color: "#94a3b8", padding: "1rem 0" }}>
            No team data — org graph may not be linked for this account.
          </div>
        ) : (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 72px 88px 28px",
              gap: "0.5rem",
              paddingBottom: "0.5rem",
              borderBottom: "2px solid #e2e8f0",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>
              <span>Role</span>
              <span style={{ textAlign: "center" }}>Direct</span>
              <span style={{ textAlign: "center" }}>In territory</span>
              <span />
            </div>
            {summary.roles.map((bucket) => (
              <DownlineRoleRow key={bucket.role} bucket={bucket} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function UplineTeamCard({ summary }: { summary: Extract<ProfileTeamSummary, { mode: "upline" }> }): React.ReactElement {
  const [open, setOpen] = useState(true);

  return (
    <Card>
      <div style={{ padding: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "0.35rem", fontSize: "0.95rem", color: "#0f172a" }}>
          Reporting Chain
        </h3>
        {summary.districtName && (
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>
            District: {summary.districtName}
          </p>
        )}

        {summary.reportingChain.length === 0 ? (
          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            No reporting chain found for your district.
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: "0.78rem",
                color: "#3b82f6",
                padding: 0,
                marginBottom: open ? "0.75rem" : 0,
              }}
            >
              {open ? "Hide managers" : `Show ${summary.reportingChain.length} managers`}
            </button>
            {open && (
              <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.5rem" }}>
                {summary.reportingChain.map((person, idx) => (
                  <li key={`${person.id}-${idx}`} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#dbeafe",
                      color: "#1d4ed8",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "0.65rem",
                    }}>
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <TeamPersonRow member={person} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function TeamHierarchyCard({ summary }: { summary: ProfileTeamSummary }): React.ReactElement {
  if (summary.mode === "upline") return <UplineTeamCard summary={summary} />;
  return <DownlineTeamCard summary={summary} />;
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage(): React.ReactElement {
  const { data, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageHeader title="My Profile" subtitle="Loading…" />
        <div style={{ display: "grid", gap: "1.5rem", maxWidth: "900px" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: 180, background: "#f1f5f9", borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageHeader title="My Profile" subtitle="Unable to load profile" />
        <Card>
          <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
            Failed to load profile. Please refresh the page.
          </div>
        </Card>
      </div>
    );
  }

  const { user, posp, salesTeam, teamSummary } = data;
  const rm = roleMeta(user.role);
  const displayName = salesTeam?.name ?? posp?.name ?? user.email;
  const displaySub  = salesTeam?.designation
    ?? (posp ? `${posp.code}${posp.externalId ? ` · ${posp.externalId}` : ""}` : user.role);

  return (
    <div style={{ padding: "2rem" }}>
      <PageHeader title="My Profile" subtitle={`${rm.label} — ${user.email}`} />

      <div style={{ display: "grid", gap: "1.5rem", maxWidth: "900px" }}>
        {/* Hero banner */}
        <div style={{
          display: "flex", alignItems: "center", gap: "1.25rem",
          padding: "1.5rem",
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
          borderRadius: "16px", color: "#fff",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", fontWeight: 700, flexShrink: 0,
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>{displayName}</div>
            <div style={{ opacity: 0.85, fontSize: "0.85rem" }}>{displaySub}</div>
            <div style={{ opacity: 0.7, fontSize: "0.78rem", marginTop: "0.15rem" }}>{user.email}</div>
          </div>
        </div>

        {posp      && <PospCard  posp={posp} />}
        {salesTeam && <TeamCard  team={salesTeam} />}
        {teamSummary && <TeamHierarchyCard summary={teamSummary} />}
        <AccountCard user={user} />
      </div>
    </div>
  );
}
