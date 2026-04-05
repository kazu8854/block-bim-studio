import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#a4de6c'];

export type DashboardChartsProps = {
  matRows: { name: string; value: number }[];
  costRows: { name: string; value: number }[];
};

export function DashboardCharts({ matRows, costRows }: DashboardChartsProps) {
  return (
    <SpaceBetween size="l">
      <Box>
        <Box variant="h3" margin={{ bottom: 's' }}>
          材料別ブロック数
        </Box>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={matRows}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="個数" fill="#0972d3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ width: '100%', height: 260, marginTop: 16 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={matRows}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={88}
                label
              >
                {matRows.map((_, i) => (
                  <Cell
                    key={String(i)}
                    fill={PIE_COLORS[i % PIE_COLORS.length]!}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Box>

      <Box>
        <Box variant="h3" margin={{ bottom: 's' }}>
          要素タイプ別コスト内訳
        </Box>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={costRows} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip
                formatter={(v) =>
                  new Intl.NumberFormat('ja-JP', {
                    style: 'currency',
                    currency: 'JPY',
                    maximumFractionDigits: 0,
                  }).format(Number(v))
                }
              />
              <Bar dataKey="value" name="コスト" fill="#d45b07" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Box>
    </SpaceBetween>
  );
}
