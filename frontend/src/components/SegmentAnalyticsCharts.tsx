"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Users, TrendingDown, DollarSign } from "lucide-react"
import type { SegmentAnalysis } from "../types"

interface SegmentAnalyticsChartsProps {
  segments: SegmentAnalysis[]
}

export default function SegmentAnalyticsCharts({ segments }: SegmentAnalyticsChartsProps) {
  if (segments.length === 0) {
    return null
  }

  const COLORS = ["#D4AF37", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

  const pieData = segments.map((seg, idx) => ({
    name: seg.segment_name,
    value: seg.customer_count,
    color: COLORS[idx % COLORS.length],
  }))

  const churnData = segments.map((seg, idx) => ({
    name: seg.segment_name,
    churnRate: Number((seg.churn_rate * 100).toFixed(1)),
    color: COLORS[idx % COLORS.length],
  }))

  const valueData = segments.map((seg, idx) => ({
    name: seg.segment_name,
    avgValue: Number(seg.avg_customer_value.toFixed(0)),
    color: COLORS[idx % COLORS.length],
  }))

  const totalCustomers = segments.reduce((sum, seg) => sum + seg.customer_count, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Customer Distribution Pie Chart */}
      <div className="glass-premium rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Customer Distribution</h3>
            <p className="text-xs text-gray-400">{totalCustomers.toLocaleString()} total customers</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: "#D4AF37", strokeWidth: 1 }}
            >
              {pieData.map((entry, index) => (
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
              formatter={(value: number) => [
                `${value.toLocaleString()} customers (${((value / totalCustomers) * 100).toFixed(1)}%)`,
                "Count",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Churn Rate Comparison */}
      <div className="glass-premium rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-monitor/10 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-monitor" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Churn Rate by Segment</h3>
            <p className="text-xs text-gray-400">Risk comparison</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={churnData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#132F4C" />
            <XAxis
              dataKey="name"
              stroke="#B2BAC2"
              style={{ fontSize: "11px" }}
              angle={-15}
              textAnchor="end"
              height={80}
            />
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
              formatter={(value: number) => [`${value}%`, "Churn Rate"]}
            />
            <Bar dataKey="churnRate" radius={[8, 8, 0, 0]}>
              {churnData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Average Value Comparison */}
      <div className="glass-premium rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-stable/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-stable" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Avg Value by Segment</h3>
            <p className="text-xs text-gray-400">Customer lifetime value</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={valueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#132F4C" />
            <XAxis
              dataKey="name"
              stroke="#B2BAC2"
              style={{ fontSize: "11px" }}
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#B2BAC2"
              style={{ fontSize: "12px" }}
              label={{ value: "Value ($)", angle: -90, position: "insideLeft", fill: "#B2BAC2" }}
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
              formatter={(value: number) => [`$${Number(value).toLocaleString()}`, "Avg Value"]}
            />
            <Bar dataKey="avgValue" radius={[8, 8, 0, 0]}>
              {valueData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
