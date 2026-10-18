import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'

export interface Candle {
  /** Unix seconds (UTC). */
  time: number
  open: number
  high: number
  low: number
  close: number
}

/** Candlestick chart on TradingView lightweight-charts (FR-062). Times show in IST. */
export function PriceChart({ candles, height = 360 }: { candles: Candle[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const chart = createChart(el, {
      height,
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#a1a1aa' },
      grid: { vertLines: { color: '#27272a' }, horzLines: { color: '#27272a' } },
      timeScale: { timeVisible: true, secondsVisible: false },
      localization: {
        timeFormatter: (t: number) =>
          new Date(t * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }),
      },
    })
    seriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    })
    chartRef.current = chart
    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [height])

  useEffect(() => {
    seriesRef.current?.setData(candles.map<CandlestickData>((c) => ({ ...c, time: c.time as UTCTimestamp })))
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  return <div ref={containerRef} className="w-full" style={{ height }} />
}
