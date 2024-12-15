import { useState } from 'react'
import StockChart from './StockChart'
import ReactMarkdown from 'react-markdown'

interface StockViewerProps {
  onClose: () => void
}

const timeframes = [
  { label: '5D', value: '5D' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'ALL', value: 'ALL' }
]

export default function StockViewer({ onClose }: StockViewerProps) {
  const [ticker, setTicker] = useState('')
  const [timeframe, setTimeframe] = useState('1M')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStockData = async (selectedTimeframe = timeframe) => {
    if (!ticker.trim() || isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await window.api.getStockData({
        ticker: ticker.toUpperCase(),
        timeframe: selectedTimeframe
      })
      if (response.success && response.data) {
        setStockData(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch stock data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker.trim() || isLoading) return
    await fetchStockData()
  }

  const handleTimeframeChange = async (newTimeframe: string) => {
    setTimeframe(newTimeframe)
    await fetchStockData(newTimeframe)
  }

  const renderTimeframeSelector = () => (
    <div className="flex gap-2 mb-4">
      {timeframes.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => handleTimeframeChange(value)}
          className={`px-3 py-1 rounded ${
            timeframe === value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold">Stock Data</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-4 overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Enter stock ticker (e.g., AAPL)"
            className="flex-1 px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-6 py-2 rounded-lg ${
              isLoading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Get Data'}
          </button>
        </form>

        {error && <div className="text-red-400 mb-4 p-4 bg-red-900/20 rounded-lg">{error}</div>}

        {stockData && (
          <div className="space-y-6">
            <div className="flex items-baseline gap-4">
              <h3 className="text-3xl font-bold">${stockData.price.toFixed(2)}</h3>
              <span
                className={`text-xl font-semibold ${
                  stockData.percentChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {stockData.percentChange >= 0 ? '+' : ''}
                {stockData.percentChange.toFixed(2)}%
              </span>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg">
              {renderTimeframeSelector()}
              <StockChart data={stockData.chartData} timeframe={timeframe} />
            </div>

            <div className="bg-gray-800/50 p-6 rounded-lg space-y-4">
              <h3 className="text-xl font-semibold mb-4">Market Analysis</h3>

              <div className="space-y-3">
                <p className="text-gray-200">{stockData.aiSummary.currentStatus}</p>
                <p className="text-gray-200">{stockData.aiSummary.recentPerformance}</p>
                <p className="text-gray-200">{stockData.aiSummary.marketContext}</p>
              </div>

              <div className="mt-4">
                <h4 className="text-lg font-semibold mb-3">Key Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stockData.aiSummary.keyMetrics.map((metric, index) => (
                    <div key={index} className="bg-gray-700/50 p-3 rounded">
                      <div className="text-gray-400 text-sm">{metric.label}</div>
                      <div className="text-lg font-semibold">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Recent News Analysis</h4>
                <div className="bg-gray-700/50 p-4 rounded">
                  <ReactMarkdown className="text-gray-200 prose prose-invert max-w-none">
                    {stockData.aiSummary.newsSummary}
                  </ReactMarkdown>
                </div>

                <div className="mt-4 space-y-4">
                  {stockData.news.map((item, index) => (
                    <div key={index} className="bg-gray-700/50 p-4 rounded">
                      <h5 className="font-semibold mb-2">{item.title}</h5>
                      <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          {item.publisher} • {item.date}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Read more →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
