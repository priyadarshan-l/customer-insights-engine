"use client"

import type React from "react"

import { useState } from "react"
import { Search, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"
import { predictChurn } from "../services/api"
import type { PredictionRequest, PredictionResponse } from "../types"
import PredictionExplanation from "./PredictionExplanation"
import { savePrediction } from "../utils/storage"

export default function RiskAnalyzer() {
  const [formData, setFormData] = useState<PredictionRequest>({
    Recency: 40,
    MntMeatProducts: 61,
    NumWebVisitsMonth: 7,
    Marital_Status: "Married",
    Education: "PhD",
    MntGoldProds: 21,
    NumStorePurchases: 4,
    MntWines: 84,
    Teenhome: 1,
    AcceptedCmp1: 0,
    AcceptedCmp2: 0,
    AcceptedCmp3: 0,
    AcceptedCmp4: 0,
    AcceptedCmp5: 0,
  })

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      console.log("[v0] Submitting prediction request:", formData)
      const result = await predictChurn(formData)
      console.log("[v0] Prediction result:", result)
      setPrediction(result)
      savePrediction(formData, result)
    } catch (error) {
      console.error("[v0] Prediction failed:", error)
      setError(error instanceof Error ? error.message : "Failed to get prediction")
      alert("Failed to get prediction. Please check if the backend is running at http://localhost:8000")
    } finally {
      setLoading(false)
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "URGENT":
        return <AlertTriangle className="w-6 h-6" />
      case "MONITOR":
        return <AlertCircle className="w-6 h-6" />
      case "STABLE":
        return <CheckCircle className="w-6 h-6" />
      default:
        return null
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "URGENT":
        return "text-urgent bg-urgent/10 border-urgent/30"
      case "MONITOR":
        return "text-monitor bg-monitor/10 border-monitor/30"
      case "STABLE":
        return "text-stable bg-stable/10 border-stable/30"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-premium rounded-2xl p-6 md:p-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gold/10 flex items-center justify-center pulse-glow">
            <Search className="w-5 h-5 md:w-6 md:h-6 text-gold" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Customer Risk Analyzer</h2>
            <p className="text-xs md:text-sm text-gray-400">Predict churn probability in real-time</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-semibold">Prediction Error</p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Recency (days)</label>
                <input
                  type="number"
                  value={formData.Recency}
                  onChange={(e) => setFormData({ ...formData, Recency: Number(e.target.value) })}
                  className="w-full bg-surface border border-gold/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Web Visits/Month</label>
                <input
                  type="number"
                  value={formData.NumWebVisitsMonth}
                  onChange={(e) => setFormData({ ...formData, NumWebVisitsMonth: Number(e.target.value) })}
                  className="w-full bg-surface border border-gold/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Marital Status</label>
                <select
                  value={formData.Marital_Status}
                  onChange={(e) => setFormData({ ...formData, Marital_Status: e.target.value })}
                  className="w-full bg-surface border border-gold/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                >
                  <option>Single</option>
                  <option>Married</option>
                  <option>Divorced</option>
                  <option>Widow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Education</label>
                <select
                  value={formData.Education}
                  onChange={(e) => setFormData({ ...formData, Education: e.target.value })}
                  className="w-full bg-surface border border-gold/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                >
                  <option>PhD</option>
                  <option>Master</option>
                  <option>Graduation</option>
                  <option>Basic</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Meat Products</label>
                <input
                  type="number"
                  value={formData.MntMeatProducts}
                  onChange={(e) => setFormData({ ...formData, MntMeatProducts: Number(e.target.value) })}
                  className="w-full bg-surface border border-gold/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Gold Products</label>
                <input
                  type="number"
                  value={formData.MntGoldProds}
                  onChange={(e) => setFormData({ ...formData, MntGoldProds: Number(e.target.value) })}
                  className="w-full bg-surface border border-gold/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Wines</label>
                <input
                  type="number"
                  value={formData.MntWines}
                  onChange={(e) => setFormData({ ...formData, MntWines: Number(e.target.value) })}
                  className="w-full bg-surface border border-gold/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze Customer Risk"}
            </button>
          </form>

          {/* Prediction Result */}
          <div className="flex items-center justify-center">
            {prediction ? (
              <div className="w-full space-y-4">
                <div className={`${getRiskColor(prediction.risk_level)} border-2 rounded-2xl p-6 text-center`}>
                  <div className="flex justify-center mb-3">{getRiskIcon(prediction.risk_level)}</div>
                  <h3 className="text-3xl font-bold mb-2">{prediction.risk_level}</h3>
                  <p className="text-sm opacity-80">Risk Level</p>
                </div>

                <div className="glass rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Churn Probability</span>
                    <span className="text-2xl font-bold font-mono">
                      {(prediction.churn_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Customer Segment</span>
                    <span className="text-lg font-semibold text-gold">{prediction.segment}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Cluster ID</span>
                    <span className="text-lg font-mono">{prediction.cluster}</span>
                  </div>
                </div>

                <div className="bg-surface-light rounded-xl p-4 border border-gold/20">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-gold">Recommendation:</span>{" "}
                    {prediction.risk_level === "URGENT"
                      ? "Immediate intervention required. Offer personalized retention incentives."
                      : prediction.risk_level === "MONITOR"
                        ? "Monitor closely. Consider engagement campaigns."
                        : "Customer is stable. Continue regular engagement."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Enter customer details and click analyze to see prediction</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prediction Explanation */}
      {prediction && <PredictionExplanation formData={formData} churnProbability={prediction.churn_probability} />}
    </div>
  )
}
