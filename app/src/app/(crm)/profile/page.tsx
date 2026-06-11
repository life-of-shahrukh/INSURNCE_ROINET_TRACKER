"use client";

import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { fmtDate } from "@/lib/formatters";
import type { ProfilePosp, ProfileSalesTeam, ProfileUser } from "@/lib/api/profile-api";

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

  const { user, posp, salesTeam } = data;
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
        <AccountCard user={user} />
      </div>
    </div>
  );
}
