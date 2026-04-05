import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type CompareChartsProps = {
  chartData: { name: string; cost: number }[];
};

export function CompareCharts({ chartData }: CompareChartsProps) {
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(v) =>
              new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                maximumFractionDigits: 0,
              }).format(Number(v))
            }
          />
          <Legend />
          <Bar dataKey="cost" name="コスト概算" fill="#0972d3" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
