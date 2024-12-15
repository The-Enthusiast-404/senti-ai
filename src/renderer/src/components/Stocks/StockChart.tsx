import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'

interface StockChartProps {
  data: {
    date: string
    price: number
  }[]
  timeframe: string
}

export default function StockChart({ data, timeframe }: StockChartProps) {
  const formatXAxis = (date: string) => {
    const dateObj = new Date(date)
    switch (timeframe) {
      case '5D':
        return format(dateObj, 'HH:mm')
      case '1M':
        return format(dateObj, 'MMM d')
      case '6M':
      case '1Y':
        return format(dateObj, 'MMM')
      case 'ALL':
        return format(dateObj, 'yyyy')
      default:
        return format(dateObj, 'MMM d')
    }
  }

  const formatTooltip = (date: string) => {
    const dateObj = new Date(date)
    return format(dateObj, 'MMM d, yyyy HH:mm')
  }

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
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
            tickFormatter={formatXAxis}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
            labelStyle={{ color: '#9ca3af' }}
            labelFormatter={formatTooltip}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
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
