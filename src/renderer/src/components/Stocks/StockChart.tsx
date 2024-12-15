import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface StockChartProps {
  data: {
    date: string
    price: number
  }[]
}

export default function StockChart({ data }: StockChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
          <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
