import type { Deal } from '@/shared/types/crm.types';
import { BarChart } from '@/shared/components/bar-chart';
import { computeOpenPipelineByPolicy } from '@/shared/utils/crm-calculations';
import { fmtINRShort } from '@/shared/utils/formatters';

interface OpenPipelineChartProps {
  deals: Deal[];
}

export function OpenPipelineChart({ deals }: OpenPipelineChartProps): React.ReactElement {
  const rows = computeOpenPipelineByPolicy(deals);

  const items = rows.map((row) => ({
    key: row.label,
    label: row.label,
    value: row.value,
    displayValue: fmtINRShort(row.value),
  }));

  return (
    <BarChart
      items={items}
      emptyMessage="No open deals in pipeline."
      barColor="#0f4c75"
      minColumnWidth={56}
      chartHeight={130}
    />
  );
}
