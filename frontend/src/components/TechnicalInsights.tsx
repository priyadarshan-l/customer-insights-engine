"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Brain, TrendingUp, Download } from "lucide-react"
import { getFeatureImportance } from "../services/api"
import { getClusteredSegments } from "../utils/storage"
import type { FeatureImportance } from "../types"

export default function TechnicalInsights() {
  const [features, setFeatures] = useState<FeatureImportance[]>([])
  const [clusters, setClusters] = useState<{ name: string; value: number; color: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const featuresData = await getFeatureImportance()
      if (Array.isArray(featuresData)) {
        setFeatures(featuresData.slice(0, 10))
      } else {
        console.error("Invalid features data format:", featuresData)
        setFeatures([])
      }

      const segmentsData = getClusteredSegments()
      if (segmentsData && segmentsData.length > 0) {
        const COLORS = ["#D4AF37", "#10B981", "#F59E0B"]
        const clusterData = segmentsData.map((seg, idx) => ({
          name: seg.segment_name,
          value: seg.customer_count,
          color: COLORS[idx % COLORS.length],
        }))
        setClusters(clusterData)
      } else {
        setClusters([])
      }
    } catch (error) {
      console.error("Failed to load technical data:", error)
      setFeatures([])
      setClusters([])
    } finally {
      setLoading(false)
    }
  }

  const exportFeatureData = () => {
    const csvContent = "Feature,Importance\n" + features.map((item) => `${item.feature},${item.importance}`).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `feature-importance-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const exportClusterData = () => {
    const csvContent = "Segment,Customer Count\n" + clusters.map((item) => `${item.name},${item.value}`).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `segment-distribution-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 shimmer h-96" />
        <div className="glass rounded-2xl p-6 shimmer h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Technical Insights</h2>
        <p className="text-sm text-gray-400">Model performance and feature analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Feature Importance</h3>
                <p className="text-xs text-gray-400">Top 10 predictive features</p>
              </div>
            </div>
            {features.length > 0 && (
              <button
                onClick={exportFeatureData}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
          {features.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No feature importance data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={features} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#132F4C" />
                <XAxis type="number" stroke="#B2BAC2" />
                <YAxis dataKey="feature" type="category" width={120} stroke="#B2BAC2" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A1929",
                    border: "1px solid rgba(212, 175, 55, 0.2)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="importance" fill="#D4AF37" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cluster Distribution */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Segment Distribution</h3>
                <p className="text-xs text-gray-400">Your customer segmentation</p>
              </div>
            </div>
            {clusters.length > 0 && (
              <button
                onClick={exportClusterData}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
          {clusters.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No segment data yet. Upload a CSV in Customer Segments to see your distribution.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clusters}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {clusters.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0A1929",
                    border: "1px solid rgba(212, 175, 55, 0.2)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value} customers`, "Count"]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-gray-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Model Metrics */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">Model Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-light rounded-lg p-4 border border-gold/20">
            <p className="text-xs text-gray-400 mb-1">Algorithm</p>
            <p className="text-lg font-bold font-mono text-gold">XGBoost</p>
          </div>
          <div className="bg-surface-light rounded-lg p-4 border border-gold/20">
            <p className="text-xs text-gray-400 mb-1">Accuracy</p>
            <p className="text-lg font-bold font-mono text-stable">87.7%</p>
          </div>
          <div className="bg-surface-light rounded-lg p-4 border border-gold/20">
            <p className="text-xs text-gray-400 mb-1">Precision</p>
            <p className="text-lg font-bold font-mono text-stable">58.1%</p>
          </div>
          <div className="bg-surface-light rounded-lg p-4 border border-gold/20">
            <p className="text-xs text-gray-400 mb-1">Recall</p>
            <p className="text-lg font-bold font-mono text-stable">64.2%</p>
          </div>
        </div>
      </div>
    </div>
  )
}
