"use client"

import React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export interface StockDataPoint {
  date: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockData {
  symbol: string
  company_name: string
  period: string
  interval: string
  current_price: number
  change: number
  change_percent: number
  market_cap: number
  pe_ratio: string
  dividend_yield: string
  ma_20: number | null
  ma_50: number | null
  data_points: number
  chart_data: StockDataPoint[]
  chart_type: string
  last_updated: string
  data_range: {
    start: string
    end: string
  }
}

interface StockChartProps {
  stockData: StockData
}

export const StockChart = ({ stockData }: StockChartProps) => {
  const formatPrice = (price: number | null | undefined) => {
    if (price == null || isNaN(price)) return 'N/A'
    return `$${price.toFixed(2)}`
  }
  const formatMarketCap = (cap: number | null | undefined) => {
    if (cap == null || isNaN(cap)) return 'N/A'
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`
    return `$${cap.toLocaleString()}`
  }

  const isPositive = (stockData.change || 0) >= 0
  const chartData = stockData.chart_data || []
  const currentPrice = stockData.current_price || 0
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.high || 0)) : currentPrice
  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.low || 0)) : currentPrice
  const priceRange = maxPrice - minPrice || 1

  return (
    <div className="w-full bg-card border rounded-xl p-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {stockData.symbol || 'N/A'} - {stockData.company_name || 'Unknown Company'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {stockData.period || 'N/A'} • {stockData.interval || 'N/A'} intervals
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {formatPrice(stockData.current_price)}
          </div>
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}{formatPrice(stockData.change)} ({(stockData.change_percent || 0).toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <div className="h-64 bg-muted/20 rounded-lg p-4 relative overflow-hidden">
          {chartData.length > 0 ? (
            <svg width="100%" height="100%" className="absolute inset-0">
              {chartData.map((dataPoint, index) => {
                const x = (index / (chartData.length - 1)) * 100
                const open = dataPoint.open || 0
                const close = dataPoint.close || 0
                const high = dataPoint.high || 0
                const low = dataPoint.low || 0
                const bodyTop = ((maxPrice - Math.max(open, close)) / priceRange) * 100
                const bodyBottom = ((maxPrice - Math.min(open, close)) / priceRange) * 100
                const wickTop = ((maxPrice - high) / priceRange) * 100
                const wickBottom = ((maxPrice - low) / priceRange) * 100
                const isGreen = close >= open

                return (
                  <g key={index}>
                    {/* Wick */}
                    <line
                      x1={`${x}%`}
                      y1={`${wickTop}%`}
                      x2={`${x}%`}
                      y2={`${wickBottom}%`}
                      stroke={isGreen ? "#22c55e" : "#ef4444"}
                      strokeWidth="1"
                    />
                    {/* Body */}
                    <rect
                      x={`${x - 1}%`}
                      y={`${bodyTop}%`}
                      width="2%"
                      height={`${Math.abs(bodyBottom - bodyTop)}%`}
                      fill={isGreen ? "#22c55e" : "#ef4444"}
                      opacity="0.8"
                    />
                  </g>
                )
              })}
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="text-lg mb-2">No chart data available</div>
                <div className="text-sm">Chart data is currently unavailable for this stock</div>
              </div>
            </div>
          )}

          {/* Price labels */}
          {chartData.length > 0 && (
            <>
              <div className="absolute left-2 top-2 text-xs text-muted-foreground">
                {formatPrice(maxPrice)}
              </div>
              <div className="absolute left-2 bottom-2 text-xs text-muted-foreground">
                {formatPrice(minPrice)}
              </div>
            </>
          )}
        </div>

        {/* Date range */}
        {stockData.data_range && (
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{stockData.data_range.start}</span>
            <span>{stockData.data_range.end}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Market Cap</div>
          <div className="font-medium">{formatMarketCap(stockData.market_cap)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">P/E Ratio</div>
          <div className="font-medium">{stockData.pe_ratio || 'N/A'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Dividend Yield</div>
          <div className="font-medium">{stockData.dividend_yield || 'N/A'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Data Points</div>
          <div className="font-medium">{stockData.data_points || 0}</div>
        </div>
      </div>

      {/* Last updated */}
      {stockData.last_updated && (
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          Last updated: {format(new Date(stockData.last_updated), "MMM dd, yyyy 'at' h:mm a")}
        </div>
      )}
    </div>
  )
}