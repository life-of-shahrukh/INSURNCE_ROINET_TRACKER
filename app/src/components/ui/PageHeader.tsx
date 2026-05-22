import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="topbar">
      <div>
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </div>
  );
}
