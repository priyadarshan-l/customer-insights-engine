"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Users, Target, Layers, HistoryIcon, Activity } from "lucide-react"
import { getGlobalMetrics } from "../services/api"
import type { GlobalMetrics } from "../types"
import { getHistoryStats, getClusteredSegments } from "../utils/storage"

export default function ExecutiveOverview() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [historyStats, setHistoryStats] = useState<any>(null)

  useEffect(() => {
    loadMetrics()
    loadHistoryStats()
    const interval = setInterval(() => {
      loadHistoryStats()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadMetrics = async () => {
    try {
      const data = await getGlobalMetrics()
      setMetrics(data)
    } catch (error) {
      console.error("Failed to load metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistoryStats = () => {
    const stats = getHistoryStats()
    setHistoryStats(stats)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 shimmer h-32" />
        ))}
      </div>
    )
  }

  const clusteredSegments = getClusteredSegments()
  const activeSegments = clusteredSegments ? clusteredSegments.length : Object.keys(metrics?.segments || {}).length

  const totalCustomers = clusteredSegments
    ? clusteredSegments.reduce((sum, seg) => sum + seg.customer_count, 0)
    : metrics?.total_customers || 0

  const avgChurnRate = clusteredSegments
    ? clusteredSegments.reduce((sum, seg) => sum + seg.churn_rate * seg.customer_count, 0) / totalCustomers
    : metrics?.churn_rate || 0

  const stats = [
    {
      label: "Total Customers",
      value: totalCustomers.toLocaleString(),
      icon: Users,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      label: "Churn Rate",
      value: `${(avgChurnRate * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-monitor",
      bgColor: "bg-monitor/10",
    },
    {
      label: "Model Accuracy",
      value: `${((metrics?.model_accuracy || 0) * 100).toFixed(1)}%`,
      icon: Target,
      color: "text-stable",
      bgColor: "bg-stable/10",
    },
    {
      label: "Active Segments",
      value: activeSegments.toString(),
      icon: Layers,
      color: "text-gold-light",
      bgColor: "bg-gold-light/10",
    },
    {
      label: "Predictions Made",
      value: historyStats?.totalPredictions.toLocaleString() || "0",
      icon: HistoryIcon,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Avg Predicted Risk",
      value: `${(historyStats?.avgChurnRate || 0).toFixed(1)}%`,
      icon: Activity,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="glass-premium rounded-2xl p-6 hover:border-gold/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold font-mono">{stat.value}</p>
            </div>
            <div className={`${stat.bgColor} ${stat.color} p-3 rounded-xl`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
