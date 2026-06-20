'use client';

import type { UnifiedOrgNode } from '@/lib/types';
import { useOrgChartContext } from './OrgChartContext';

interface RosterCardProps {
  node: UnifiedOrgNode;
  onClick: (node: UnifiedOrgNode) => void;
}

export function RosterCard({ node, onClick }: RosterCardProps) {
  const { selectedId } = useOrgChartContext();
  const isSelected = selectedId === node.id;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDeptColor = (dept?: string) => {
    if (!dept) return 'neutral';
    const colors = ['1', '2', '3', '4', '5', '6', '7'];
    const hash = dept.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div
      className={`roster-card ${isSelected ? 'selected' : ''} ${node.type === 'POSP' ? 'posp-card' : ''}`}
      onClick={() => onClick(node)}
    >
      <div className="card-header">
        <div className="avatar">
          {node.profilePic ? (
            <img src={node.profilePic} alt={node.name} />
          ) : (
            <span className="initials">{getInitials(node.name)}</span>
          )}
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-name">{node.name}</h3>
        <p className="card-designation">
          {node.type === 'SALES' ? node.designation : node.code}
        </p>

        {node.department && (
          <span className={`dept-badge dept-color-${getDeptColor(node.department)}`}>
            {node.department}
          </span>
        )}

        {node.location && (
          <p className="card-location">📍 {node.location}</p>
        )}
      </div>

      <div className="card-footer">
        <span className="reports-count">
          {node.directReports > 0 && `${node.directReports} Direct`}
          {node.directReports > 0 && node.totalReports > node.directReports && ' | '}
          {node.totalReports > node.directReports && `${node.totalReports} Total`}
        </span>
      </div>
    </div>
  );
}
