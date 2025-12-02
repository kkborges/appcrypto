import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface CryptoChartProps {
  data: Array<{
    time: string;
    price: number;
    volume?: number;
    change_percent?: number;
  }>;
}

export default function CryptoChart({ data }: CryptoChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Sem dados disponíveis
      </div>
    );
  }

  const formattedData = data.map(item => ({
    ...item,
    time: format(new Date(item.time), 'HH:mm'),
    price: parseFloat(item.price.toString()),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value: any) => [`$${parseFloat(value).toFixed(8)}`, 'Preço']}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
