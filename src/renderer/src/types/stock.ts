interface StockData {
  ticker: string
  price: number
  highPrice: number
  lowPrice: number
  previousClose: number
  percentChange: number
  volume: number
  lastUpdated: string
  marketCap?: number
  dayRange?: string
  yearRange?: string
  avgVolume?: number
  peRatio?: number
  dividend?: number
  chartData?: Array<{
    date: string
    price: number
  }>
  news?: Array<{
    title: string
    description: string
    url: string
    date: string
  }>
  aiSummary?: {
    currentStatus: string
    recentPerformance: string
    marketContext: string
    keyMetrics: {
      label: string
      value: string
    }[]
    newsSummary: string
  }
}
