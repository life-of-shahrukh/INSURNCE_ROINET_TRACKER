import type { Deal } from '@/shared/types/crm.types';
import { BarChart } from '@/shared/components/bar-chart';
import { computePremiumBands } from '@/shared/utils/crm-calculations';

interface PremiumBandChartProps {
  deals: Deal[];
}

export function PremiumBandChart({ deals }: PremiumBandChartProps): React.ReactElement {
  const bands = computePremiumBands(deals);

  const items = bands.map((band) => ({
    key: band.label,
    label: band.label,
    value: band.count,
    displayValue: String(band.count),
  }));

  return (
    <BarChart
      items={items}
      emptyMessage="No deals to chart yet."
      minColumnWidth={48}
      chartHeight={120}
    />
  );
}
