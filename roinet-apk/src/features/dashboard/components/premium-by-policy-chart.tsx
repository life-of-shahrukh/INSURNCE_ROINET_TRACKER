import type { Deal } from '@/shared/types/crm.types';
import { BarChart } from '@/shared/components/bar-chart';
import { fmtINRShort } from '@/shared/utils/formatters';

interface PremiumByPolicyChartProps {
  deals: Deal[];
}

export function PremiumByPolicyChart({ deals }: PremiumByPolicyChartProps): React.ReactElement {
  const policySums: Record<string, number> = {};
  deals.forEach((d) => {
    policySums[d.policy] = (policySums[d.policy] || 0) + (+d.premium || 0);
  });

  const items = Object.entries(policySums)
    .map(([label, value]) => ({
      key: label,
      label,
      value,
      displayValue: fmtINRShort(value),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <BarChart
      items={items}
      emptyMessage="No premium data yet."
      minColumnWidth={56}
      chartHeight={130}
    />
  );
}
