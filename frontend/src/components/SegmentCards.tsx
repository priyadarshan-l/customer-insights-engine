"use client"

import { useEffect, useState } from "react"
import { Users, TrendingDown, DollarSign, Target } from "lucide-react"
import { getSegmentAnalysis } from "../services/api"
import type { SegmentAnalysis } from "../types"
import { getClusteredSegments } from "../utils/storage"

export default function SegmentCards() {
  const [segments, setSegments] = useState<SegmentAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<"clustered" | "fallback">("fallback")

  useEffect(() => {
    loadSegments()
    const interval = setInterval(loadSegments, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadSegments = async () => {
    try {
      const clusteredData = getClusteredSegments()

      if (clusteredData && clusteredData.length > 0) {
        console.log("[v0] Using real clustered segment data:", clusteredData.length, "segments")
        setSegments(clusteredData)
        setDataSource("clustered")
      } else {
        console.log("[v0] No clustered data found, using fallback from backend")
        const data = await getSegmentAnalysis()
        if (Array.isArray(data)) {
          setSegments(data)
          setDataSource("fallback")
        } else {
          console.error("Invalid segments data format:", data)
          setSegments([])
        }
      }
    } catch (error) {
      console.error("Failed to load segments:", error)
      setSegments([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 shimmer h-64" />
        ))}
      </div>
    )
  }

  if (segments.length === 0) {
    return (
      <div className="glass-premium rounded-2xl p-6 text-center">
        <p className="text-gray-400">No segment data available. Please check if the backend is running correctly.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Segment Intelligence</h2>
          <p className="text-sm text-gray-400">
            {dataSource === "clustered"
              ? "Real customer segments from clustering"
              : "Sample segments (upload data in Customer Segments to see real data)"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment, index) => (
          <div
            key={index}
            className="glass-premium rounded-2xl p-6 hover:border-gold/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gold">{segment.segment_name}</h3>
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Customers
                </span>
                <span className="font-mono font-semibold text-white">{segment.customer_count.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Churn Rate
                </span>
                <span className="font-mono font-semibold text-monitor">{(segment.churn_rate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Avg Value
                </span>
                <span className="font-mono font-semibold text-stable">${segment.avg_customer_value.toFixed(0)}</span>
              </div>
            </div>

            <div className="border-t border-gold/20 pt-4 mb-4">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-2 font-semibold">
                <Target className="w-3 h-3" />
                KEY CHARACTERISTICS
              </p>
              <ul className="space-y-1">
                {segment.characteristics.slice(0, 3).map((char, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-gold mt-1">•</span>
                    <span>{char}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-light rounded-lg p-3 border border-gold/20">
              <p className="text-xs text-gray-400 mb-1 font-semibold">RETENTION STRATEGY</p>
              <p className="text-sm text-gray-200 leading-relaxed">{segment.retention_strategy}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
