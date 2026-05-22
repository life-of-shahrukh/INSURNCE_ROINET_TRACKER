import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, headerRight, children, className = "" }: CardProps) {
  return (
    <div className={`card ${className}`.trim()}>
      {title && (
        <div className="card-header">
          <div className="card-title">{title}</div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}
