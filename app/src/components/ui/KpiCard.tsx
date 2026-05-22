interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  variant?: "" | "hot" | "warm" | "success";
}

export function KpiCard({ label, value, sub, variant = "" }: KpiCardProps) {
  return (
    <div className={`kpi-card ${variant}`.trim()}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
