"use client"

import { TrendingUp, TrendingDown, Info } from "lucide-react"
import type { PredictionRequest } from "../types"

interface FeatureImpact {
  feature: string
  impact: number
  description: string
  value: string | number
}

interface PredictionExplanationProps {
  formData: PredictionRequest
  churnProbability: number
}

export default function PredictionExplanation({ formData, churnProbability }: PredictionExplanationProps) {
  // Calculate feature impacts based on input values
  const calculateFeatureImpacts = (): FeatureImpact[] => {
    const impacts: FeatureImpact[] = []

    // Recency impact (higher recency = higher churn risk)
    const recencyImpact = formData.Recency > 30 ? (formData.Recency / 100) * 0.3 : -(30 - formData.Recency) / 100
    impacts.push({
      feature: "Recency",
      impact: recencyImpact,
      description: "Days since last purchase",
      value: `${formData.Recency} days`,
    })

    // Web visits impact (higher visits = lower churn risk)
    const webVisitsImpact = formData.NumWebVisitsMonth > 5 ? -(formData.NumWebVisitsMonth / 20) : 0.15
    impacts.push({
      feature: "Web Visits",
      impact: webVisitsImpact,
      description: "Monthly website engagement",
      value: `${formData.NumWebVisitsMonth} visits/month`,
    })

    // Total spending impact (higher spending = lower churn risk)
    const totalSpending = formData.MntMeatProducts + formData.MntGoldProds + formData.MntWines
    const spendingImpact = totalSpending > 150 ? -(totalSpending / 500) : (150 - totalSpending) / 500
    impacts.push({
      feature: "Total Spending",
      impact: spendingImpact,
      description: "Combined product purchases",
      value: `$${totalSpending}`,
    })

    // Wine purchases impact (premium indicator)
    const wineImpact = formData.MntWines > 50 ? -(formData.MntWines / 300) : 0.1
    impacts.push({
      feature: "Wine Purchases",
      impact: wineImpact,
      description: "Premium product engagement",
      value: `$${formData.MntWines}`,
    })

    // Education impact (higher education = lower churn)
    const educationImpact = formData.Education === "PhD" || formData.Education === "Master" ? -0.08 : 0.05
    impacts.push({
      feature: "Education Level",
      impact: educationImpact,
      description: "Customer education background",
      value: formData.Education,
    })

    // Sort by absolute impact
    return impacts.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 5)
  }

  const featureImpacts = calculateFeatureImpacts()
  const maxImpact = Math.max(...featureImpacts.map((f) => Math.abs(f.impact)))

  return (
    <div className="glass-premium rounded-2xl p-6 md:p-8 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
          <Info className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Why This Prediction?</h3>
          <p className="text-sm text-gray-400">
            Top factors contributing to the {(churnProbability * 100).toFixed(1)}% churn probability
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {featureImpacts.map((feature, index) => {
          const isPositive = feature.impact > 0
          const barWidth = (Math.abs(feature.impact) / maxImpact) * 100

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-urgent" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-stable" />
                  )}
                  <span className="font-semibold text-sm">{feature.feature}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{feature.value}</span>
              </div>

              <div className="relative h-10 bg-surface rounded-lg overflow-hidden border border-gold/10">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-700 ${
                    isPositive
                      ? "bg-gradient-to-r from-urgent/60 to-urgent"
                      : "bg-gradient-to-r from-stable/60 to-stable"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs text-white/90 font-medium">{feature.description}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                {isPositive ? "Increases churn risk" : "Decreases churn risk"} by{" "}
                <span className="font-semibold">{(Math.abs(feature.impact) * 100).toFixed(1)}%</span>
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-surface-light rounded-lg border border-gold/20">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-gold font-semibold">Note:</span> Feature impacts are calculated based on typical
          patterns in customer behavior. Higher recency and lower engagement typically indicate higher churn risk, while
          higher spending and engagement reduce churn probability.
        </p>
      </div>
    </div>
  )
}
