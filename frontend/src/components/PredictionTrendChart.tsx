"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Activity, Download } from "lucide-react"
import { getPredictionHistory } from "../utils/storage"

export default function PredictionTrendChart() {
  const [data, setData] = useState<{ date: string; avgChurn: number; count: number }[]>([])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = () => {
    const history = getPredictionHistory()

    // Group predictions by date
    const groupedByDate: Record<string, { total: number; count: number }> = {}

    history.forEach((pred) => {
      const date = new Date(pred.timestamp).toLocaleDateString()
      if (!groupedByDate[date]) {
        groupedByDate[date] = { total: 0, count: 0 }
      }
      groupedByDate[date].total += pred.result.churn_probability * 100
      groupedByDate[date].count += 1
    })

    // Convert to array and calculate averages
    const chartData = Object.entries(groupedByDate)
      .map(([date, values]) => ({
        date,
        avgChurn: Number.parseFloat((values.total / values.count).toFixed(1)),
        count: values.count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7) // Last 7 days

    setData(chartData)
  }

  const exportData = () => {
    const csvContent =
      "Date,Average Churn %,Predictions Count\n" +
      data.map((item) => `${item.date},${item.avgChurn},${item.count}`).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `prediction-trends-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Prediction Trends</h3>
              <p className="text-xs text-gray-400">Average churn rate over time</p>
            </div>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center text-gray-400">
          No trend data yet. Make predictions to see trends over time.
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Prediction Trends</h3>
            <p className="text-xs text-gray-400">Last 7 days average churn rate</p>
          </div>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#132F4C" />
          <XAxis dataKey="date" stroke="#B2BAC2" style={{ fontSize: "12px" }} />
          <YAxis
            stroke="#B2BAC2"
            style={{ fontSize: "12px" }}
            label={{ value: "Churn %", angle: -90, position: "insideLeft", fill: "#B2BAC2" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0A1929",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
            itemStyle={{
              color: "#FFFFFF",
              fontSize: "14px",
            }}
            labelStyle={{
              color: "#D4AF37",
              fontWeight: "600",
              marginBottom: "4px",
            }}
            cursor={{ fill: "rgba(212, 175, 55, 0.1)" }}
            formatter={(value: number, name: string) => {
              if (name === "avgChurn") return [`${value}%`, "Avg Churn"]
              return [value, "Predictions"]
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => {
              if (value === "avgChurn") return "Average Churn %"
              return "Predictions Count"
            }}
          />
          <Line
            type="monotone"
            dataKey="avgChurn"
            stroke="#D4AF37"
            strokeWidth={3}
            dot={{ fill: "#D4AF37", r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-surface-light rounded-lg p-3 border border-gold/10">
          <p className="text-xs text-gray-400 mb-1">Latest Avg</p>
          <p className="text-xl font-bold text-gold">{data[data.length - 1]?.avgChurn}%</p>
        </div>
        <div className="bg-surface-light rounded-lg p-3 border border-gold/10">
          <p className="text-xs text-gray-400 mb-1">Total Days</p>
          <p className="text-xl font-bold text-white">{data.length}</p>
        </div>
        <div className="bg-surface-light rounded-lg p-3 border border-gold/10">
          <p className="text-xs text-gray-400 mb-1">Total Predictions</p>
          <p className="text-xl font-bold text-white">{data.reduce((sum, d) => sum + d.count, 0)}</p>
        </div>
      </div>
    </div>
  )
}
