"use client"

import { useState, useEffect } from "react"
import { History, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { getPredictionHistory, clearPredictionHistory, type StoredPrediction } from "../utils/storage"

export default function PredictionHistory() {
  const [history, setHistory] = useState<StoredPrediction[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    loadHistory()
    // Refresh history every 5 seconds to catch new predictions
    const interval = setInterval(loadHistory, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadHistory = () => {
    setHistory(getPredictionHistory())
  }

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all prediction history?")) {
      clearPredictionHistory()
      setHistory([])
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "URGENT":
        return "text-red-400 bg-red-500/10"
      case "MONITOR":
        return "text-orange-400 bg-orange-500/10"
      case "STABLE":
        return "text-emerald-400 bg-emerald-500/10"
      default:
        return "text-gray-400 bg-gray-500/10"
    }
  }

  const getTrendIcon = (churnRate: number) => {
    if (churnRate > 50) return <TrendingUp className="w-4 h-4 text-red-400" />
    if (churnRate < 20) return <TrendingDown className="w-4 h-4 text-emerald-400" />
    return <Minus className="w-4 h-4 text-orange-400" />
  }

  const displayedHistory = showAll ? history : history.slice(0, 10)

  if (history.length === 0) {
    return (
      <div className="glass-premium rounded-2xl p-8 text-center animate-fade-in">
        <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No prediction history yet</p>
        <p className="text-sm text-gray-500 mt-1">Make your first prediction to see it here</p>
      </div>
    )
  }

  return (
    <div className="glass-premium rounded-2xl overflow-hidden animate-slide-up">
      <div className="p-4 md:p-6 border-b border-gold/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <History className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white">Prediction History</h3>
            <span className="text-sm text-gray-400">({history.length} total predictions)</span>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 hover:scale-105"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="divide-y divide-gray-700/50">
        {displayedHistory.map((prediction, idx) => (
          <div
            key={prediction.id}
            className="p-4 md:p-6 hover:bg-navy/30 transition-all duration-300"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${getRiskColor(prediction.result.risk_level)}`}
                  >
                    {prediction.result.risk_level}
                  </span>
                  <span className="text-sm text-gray-400">{new Date(prediction.timestamp).toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Recency:</span>
                    <span className="ml-2 text-white font-medium">{prediction.formData.Recency}d</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Web Visits:</span>
                    <span className="ml-2 text-white font-medium">{prediction.formData.NumWebVisitsMonth}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Education:</span>
                    <span className="ml-2 text-white font-medium">{prediction.formData.Education}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Segment:</span>
                    <span className="ml-2 text-gold font-medium">{prediction.result.segment}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                {getTrendIcon(prediction.result.churn_probability * 100)}
                <div className="text-right">
                  <div className="text-2xl md:text-3xl font-bold text-white font-mono">
                    {(prediction.result.churn_probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Churn Risk</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {history.length > 10 && (
        <div className="p-4 border-t border-gold/15 text-center bg-surface/50">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-gold hover:text-gold-light transition-colors font-medium"
          >
            {showAll ? "Show Less" : `Show All ${history.length} Predictions`}
          </button>
        </div>
      )}
    </div>
  )
}
