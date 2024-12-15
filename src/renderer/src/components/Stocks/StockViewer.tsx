import { useState } from 'react'

interface StockViewerProps {
  onClose: () => void
}

export default function StockViewer({ onClose }: StockViewerProps) {
  const [ticker, setTicker] = useState('')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await window.api.getStockData(ticker.toUpperCase())
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

      <div className="p-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 mb-2">Current Price</h3>
              <p className="text-2xl font-semibold">${stockData.price.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 mb-2">Change</h3>
              <p
                className={`text-2xl font-semibold ${
                  stockData.percentChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {stockData.percentChange >= 0 ? '+' : ''}
                {stockData.percentChange.toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 mb-2">Day High</h3>
              <p className="text-xl">${stockData.highPrice.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 mb-2">Day Low</h3>
              <p className="text-xl">${stockData.lowPrice.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 mb-2">Volume</h3>
              <p className="text-xl">{stockData.volume.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-400 mb-2">Previous Close</h3>
              <p className="text-xl">${stockData.previousClose.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
