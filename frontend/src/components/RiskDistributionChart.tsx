"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { TrendingUp, Download } from "lucide-react"
import { getPredictionHistory } from "../utils/storage"

export default function RiskDistributionChart() {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = () => {
    const history = getPredictionHistory()

    const riskCounts = {
      URGENT: 0,
      MONITOR: 0,
      STABLE: 0,
    }

    history.forEach((pred) => {
      const risk = pred.result.risk_level
      if (risk in riskCounts) {
        riskCounts[risk as keyof typeof riskCounts]++
      }
    })

    setData([
      { name: "Urgent", value: riskCounts.URGENT, color: "#EF4444" },
      { name: "Monitor", value: riskCounts.MONITOR, color: "#F59E0B" },
      { name: "Stable", value: riskCounts.STABLE, color: "#10B981" },
    ])
  }

  const totalPredictions = data.reduce((sum, item) => sum + item.value, 0)

  const exportData = () => {
    const csvContent =
      "Risk Level,Count,Percentage\n" +
      data.map((item) => `${item.name},${item.value},${((item.value / totalPredictions) * 100).toFixed(1)}%`).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `risk-distribution-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (totalPredictions === 0) {
    return (
      <div className="glass-premium rounded-2xl p-6 md:p-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Risk Distribution</h3>
              <p className="text-xs text-gray-400">Customer risk breakdown</p>
            </div>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center text-gray-400">
          No predictions yet. Make your first prediction to see the distribution.
        </div>
      </div>
    )
  }

  return (
    <div className="glass-premium rounded-2xl p-6 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center pulse-glow">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Risk Distribution</h3>
            <p className="text-xs text-gray-400">{totalPredictions} total predictions</p>
          </div>
        </div>
        <button
          onClick={exportData}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-all duration-300 hover:scale-105"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
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
            formatter={(value: number) => [`${value} (${((value / totalPredictions) * 100).toFixed(1)}%)`, "Count"]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-gray-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {data.map((item) => (
          <div
            key={item.name}
            className="bg-surface-light rounded-lg p-3 border border-gold/10 hover:border-gold/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-400">{item.name}</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">{item.value}</div>
            <div className="text-xs text-gray-500">{((item.value / totalPredictions) * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
