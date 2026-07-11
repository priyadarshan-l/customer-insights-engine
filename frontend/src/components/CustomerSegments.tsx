"use client"

import type React from "react"
import SampleDataDownload from "./SampleDataDownload"
import SegmentAnalyticsCharts from "./SegmentAnalyticsCharts"

import { useEffect, useState } from "react"
import { Users, TrendingDown, DollarSign, Target, Upload, Play, Download } from "lucide-react"
import { getSegmentAnalysis, API_BASE_URL } from "../services/api"
import type { SegmentAnalysis } from "../types"
import { saveClusteredSegments } from "../utils/storage"

interface CustomerSegmentsProps {
  onNavigateToPredictor?: () => void
}

export default function CustomerSegments({ onNavigateToPredictor }: CustomerSegmentsProps) {
  const [segments, setSegments] = useState<SegmentAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [clusteringData, setClusteringData] = useState<any>(null)
  const [uploadingCSV, setUploadingCSV] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    loadSegments()
    loadClusteredData()
  }, [])

  const loadSegments = async () => {
    try {
      const data = await getSegmentAnalysis()
      if (Array.isArray(data)) {
        setSegments(data)
      } else {
        console.error("Invalid segments data format:", data)
        setSegments([])
      }
    } catch (error) {
      console.error("Failed to load segments:", error)
      setSegments([])
    } finally {
      setLoading(false)
    }
  }

  const loadClusteredData = () => {
    const stored = localStorage.getItem("clustered_customers")
    if (stored) {
      setClusteringData(JSON.parse(stored))
    }
  }

  const calculateSegmentStats = (customers: any[]): SegmentAnalysis[] => {
    const segmentMap = new Map<string, any[]>()

    // Group customers by segment
    customers.forEach((customer) => {
      const segment = customer.segment || customer.Segment || "Unknown"
      if (!segmentMap.has(segment)) {
        segmentMap.set(segment, [])
      }
      segmentMap.get(segment)!.push(customer)
    })

    const defaultChurnRates: Record<string, number> = {
      "High Engagement": 0.094,
      "Medium Engagement": 0.119,
      "Low Engagement": 0.484,
      "Promo Sensitive": 0.15,
    }

    // Calculate statistics for each segment
    const segmentStats: SegmentAnalysis[] = []

    segmentMap.forEach((customers, segmentName) => {
      const totalSpent = customers.reduce((sum, c) => {
        const spending =
          c.TotalSpent ||
          c.total_spent ||
          (c.MntWines || 0) +
            (c.MntFruits || 0) +
            (c.MntMeatProducts || 0) +
            (c.MntFishProducts || 0) +
            (c.MntSweetProducts || 0) +
            (c.MntGoldProds || 0)
        return sum + spending
      }, 0)

      const avgValue = totalSpent / customers.length

      const hasChurnData = customers.some(
        (c) =>
          c.churn !== undefined ||
          c.Churn !== undefined ||
          c.churn_prediction !== undefined ||
          c.Response !== undefined,
      )

      let churnRate: number
      if (hasChurnData) {
        // Use calculated churn rate from CSV data
        const churnCount = customers.filter(
          (c) => c.churn === 1 || c.Churn === 1 || c.churn_prediction === 1 || c.Response === 1,
        ).length
        churnRate = churnCount / customers.length
      } else {
        // Use default churn rate for this segment type
        churnRate = defaultChurnRates[segmentName] || 0.15
      }

      // Define characteristics based on segment name
      const characteristics = getSegmentCharacteristics(segmentName)
      const retentionStrategy = getRetentionStrategy(segmentName)

      segmentStats.push({
        segment_name: segmentName,
        customer_count: customers.length,
        churn_rate: churnRate,
        avg_customer_value: avgValue,
        characteristics,
        retention_strategy: retentionStrategy,
      })
    })

    return segmentStats.sort((a, b) => b.customer_count - a.customer_count)
  }

  const getSegmentCharacteristics = (segmentName: string): string[] => {
    const charMap: Record<string, string[]> = {
      "High Engagement": ["Recent purchases (low recency)", "High web engagement", "Premium product buyers"],
      "Medium Engagement": ["Moderate purchase frequency", "Average web activity", "Balanced spending patterns"],
      "Low Engagement": ["Infrequent purchases", "Low web activity", "Price-sensitive buyers"],
      "Promo Sensitive": ["High campaign acceptance", "Deal-seeking behavior", "Responds to promotions"],
    }
    return charMap[segmentName] || ["Unique customer behavior", "Requires further analysis"]
  }

  const getRetentionStrategy = (segmentName: string): string => {
    const strategyMap: Record<string, string> = {
      "High Engagement":
        "Maintain engagement with exclusive offers and loyalty rewards. Focus on premium product recommendations.",
      "Medium Engagement":
        "Personalized engagement based on customer preferences. Nurture to increase engagement level.",
      "Low Engagement":
        "Re-engagement campaigns with special discounts. Personalized outreach to understand needs and preferences.",
      "Promo Sensitive":
        "Targeted promotional campaigns with exclusive deals. Leverage discount strategies to drive purchases.",
    }
    return strategyMap[segmentName] || "Personalized engagement based on customer preferences and behavior patterns."
  }

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingCSV(true)
    setSuccessMessage(null)

    try {
      const text = await file.text()
      const lines = text.trim().split("\n")

      const firstLine = lines[0]
      const delimiter = firstLine.includes("\t") ? "\t" : ","
      console.log(`[v0] Detected CSV delimiter: ${delimiter === "\t" ? "TAB" : "COMMA"}`)

      const headers = firstLine.split(delimiter).map((h) => h.trim())

      const customers = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(delimiter)
          const customer: any = {}
          headers.forEach((header, index) => {
            const value = values[index]?.trim()
            // Try to parse as number if possible
            customer[header] = isNaN(Number(value)) ? value : Number(value)
          })
          return customer
        })

      console.log("[v0] Clustering customers:", customers.length)
      console.log("[v0] Sample customer columns:", Object.keys(customers[0] || {}))

      // Call backend clustering endpoint
      const response = await fetch(`${API_BASE_URL}/cluster-customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
        throw new Error(errorData.detail || "Clustering failed")
      }

      const result = await response.json()

      console.log("[v0] Clustering result:", result)

      // Store clustered data
      localStorage.setItem("clustered_customers", JSON.stringify(result))
      setClusteringData(result)

      const segmentStats = calculateSegmentStats(result.customers)
      setSegments(segmentStats)

      saveClusteredSegments(segmentStats)

      setSuccessMessage(
        `Successfully clustered ${result.customers.length} customers into ${segmentStats.length} segments!`,
      )
    } catch (error) {
      console.error("[v0] Clustering error:", error)
      alert(`Failed to cluster customers: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploadingCSV(false)
    }
  }

  const handlePredictCustomers = () => {
    if (clusteringData && onNavigateToPredictor) {
      localStorage.setItem("load_clustered_data", "true")
      onNavigateToPredictor()
    }
  }

  const downloadClusteredData = () => {
    if (!clusteringData) return

    const csv = [
      Object.keys(clusteringData.customers[0]).join(","),
      ...clusteringData.customers.map((c: any) => Object.values(c).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clustered_customers_${Date.now()}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-2xl p-6 shimmer h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 shimmer h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sample Data Download Section */}
      <SampleDataDownload />

      {/* Clustering Upload Section */}
      <div className="glass-premium rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Customer Segmentation</h2>
            <p className="text-sm text-gray-400">Upload raw data to cluster customers using K-Means</p>
          </div>
          {clusteringData && (
            <div className="flex gap-2">
              <button
                onClick={downloadClusteredData}
                className="px-4 py-2 bg-surface-light border border-gold/30 text-gold rounded-lg hover:bg-gold/10 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handlePredictCustomers}
                className="px-4 py-2 bg-gold text-navy-dark rounded-lg hover:bg-gold-dark transition-all flex items-center gap-2 font-semibold"
              >
                <Play className="w-4 h-4" />
                Predict Customers
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex-1 cursor-pointer">
            <div className="border-2 border-dashed border-gold/30 rounded-lg p-6 hover:border-gold/50 transition-all text-center">
              <Upload className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-sm text-gray-300">
                {uploadingCSV ? "Clustering customers..." : "Click to upload CSV for clustering"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports customer data with demographic and behavioral features
              </p>
            </div>
            <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={uploadingCSV} className="hidden" />
          </label>
        </div>

        {successMessage && (
          <div className="mt-4 p-4 bg-emerald/10 border border-emerald/30 rounded-lg flex items-center justify-between">
            <p className="text-sm text-emerald">✓ {successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald/60 hover:text-emerald transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Segment Analytics Charts */}
      {segments.length > 0 && <SegmentAnalyticsCharts segments={segments} />}

      {/* Segment Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Segment Intelligence</h2>
            <p className="text-sm text-gray-400">Customer segments with actionable insights</p>
          </div>
        </div>

        {segments.length === 0 ? (
          <div className="glass-premium rounded-2xl p-6 text-center">
            <p className="text-gray-400">No segment data available. Upload customer data above to create segments.</p>
          </div>
        ) : (
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
                    <span className="font-mono font-semibold text-white">
                      {segment.customer_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Churn Rate
                    </span>
                    <span className="font-mono font-semibold text-monitor">
                      {(segment.churn_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Avg Value
                    </span>
                    <span className="font-mono font-semibold text-stable">
                      ${segment.avg_customer_value.toFixed(0)}
                    </span>
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
        )}
      </div>
    </div>
  )
}
