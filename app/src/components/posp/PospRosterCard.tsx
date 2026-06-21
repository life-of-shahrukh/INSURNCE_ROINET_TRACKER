"use client";

import { fmtDate, fmtINRShort } from "@/lib/formatters";
import type { Posp } from "@/lib/types";

interface PospRosterCardProps {
  posp: Posp;
  onSelect: (userCode: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function geoLabel(posp: Posp): string | null {
  const extended = posp as Posp & {
    districtName?: string | null;
    stateName?: string | null;
    cityName?: string | null;
    region?: string | null;
  };
  const parts = [
    extended.cityName,
    extended.districtName,
    extended.stateName ?? extended.region,
  ].filter((p): p is string => !!p && p.trim().length > 0);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function PospRosterCard({
  posp,
  onSelect,
}: PospRosterCardProps): React.ReactElement {
  const location = geoLabel(posp);
  const initials = getInitials(posp.name);
  const dealCount = posp.dealCount ?? 0;
  const premiumTotal = posp.premiumTotal ?? 0;

  const handleActivate = () => onSelect(posp.code);

  return (
    <article
      className={`posp-roster-card${posp.active ? "" : " posp-roster-card--inactive"}`}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
      aria-label={`View profile for ${posp.name}`}
    >
      <div className="posp-roster-card__accent" aria-hidden />

      <div className="posp-roster-card__top">
        <div className="posp-roster-card__identity">
          <div className="posp-roster-card__avatar" aria-hidden>
            {initials}
          </div>
          <div className="posp-roster-card__title-block">
            <h3 className="posp-roster-card__name">{posp.name}</h3>
            <span className="posp-roster-card__code">{posp.code}</span>
          </div>
        </div>
        <div className="posp-roster-card__status-block">
          <span
            className={`posp-roster-card__status${posp.active ? " posp-roster-card__status--active" : " posp-roster-card__status--inactive"}`}
            title={posp.active ? "Active" : "Inactive"}
          >
            <span className="posp-roster-card__status-dot" aria-hidden />
            {posp.active ? "Active" : "Inactive"}
          </span>
          <p className="posp-roster-card__status-hint">
            {posp.active
              ? "Deal in last 30 days"
              : "No deal in 30 days"}
          </p>
        </div>
      </div>

      {location && (
        <p className="posp-roster-card__location">
          <span className="posp-roster-card__icon" aria-hidden>⌖</span>
          {location}
        </p>
      )}

      <div className="posp-roster-card__meta">
        <span className="posp-roster-card__meta-item">
          <span className="posp-roster-card__icon" aria-hidden>☎</span>
          {posp.mobile || "—"}
        </span>
        <span className="posp-roster-card__meta-item">
          <span className="posp-roster-card__icon" aria-hidden>◷</span>
          Joined {fmtDate(posp.joined)}
        </span>
      </div>

      <div className="posp-roster-card__stats">
        <div className="posp-roster-card__stat">
          <span className="posp-roster-card__stat-value">{dealCount}</span>
          <span className="posp-roster-card__stat-label">Deals</span>
        </div>
        <div className="posp-roster-card__stat">
          <span className="posp-roster-card__stat-value">{fmtINRShort(premiumTotal)}</span>
          <span className="posp-roster-card__stat-label">Premium</span>
        </div>
      </div>

      <div className="posp-roster-card__footer">
        <span>View profile</span>
        <span className="posp-roster-card__chevron" aria-hidden>→</span>
      </div>
    </article>
  );
}
