import type { Deal } from '@/shared/types/crm.types';
import { BarChart } from '@/shared/components/bar-chart';
import { computeTimeBandPremiums } from '@/shared/utils/crm-calculations';
import { fmtINRShort } from '@/shared/utils/formatters';

interface TimeBandChartProps {
  deals: Deal[];
}

export function TimeBandChart({ deals }: TimeBandChartProps): React.ReactElement {
  const rows = computeTimeBandPremiums(deals);
  const hasOpen = rows.some((row) => row.premium > 0);

  const items = rows.map((row) => ({
    key: row.key,
    label: row.label,
    value: row.premium,
    displayValue: fmtINRShort(row.premium),
    color: row.color,
  }));

  return (
    <BarChart
      items={hasOpen ? items : []}
      emptyMessage="No open pipeline deals."
      minColumnWidth={64}
      chartHeight={130}
    />
  );
}
