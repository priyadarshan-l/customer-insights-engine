export interface StoredPrediction {
  id: string
  timestamp: number
  formData: {
    Recency: number
    NumWebVisitsMonth: number
    MntMeatProducts: number
    MntGoldProds: number
    MntWines: number
    Education: string
    Marital_Status: string
  }
  result: {
    churn_probability: number
    risk_level: string
    segment: string
    cluster: number
  }
}

const STORAGE_KEY = "churn_predictions_history"
const MAX_HISTORY = 50
const CLUSTERED_SEGMENTS_KEY = "clustered_segments_data"

export const savePrediction = (formData: any, result: any): void => {
  const history = getPredictionHistory()

  const newPrediction: StoredPrediction = {
    id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    formData: {
      Recency: formData.Recency,
      NumWebVisitsMonth: formData.NumWebVisitsMonth,
      MntMeatProducts: formData.MntMeatProducts,
      MntGoldProds: formData.MntGoldProds,
      MntWines: formData.MntWines,
      Education: formData.Education,
      Marital_Status: formData.Marital_Status,
    },
    result: {
      churn_probability: result.churn_probability,
      risk_level: result.risk_level,
      segment: result.segment,
      cluster: result.cluster,
    },
  }

  const updatedHistory = [newPrediction, ...history].slice(0, MAX_HISTORY)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
}

export const getPredictionHistory = (): StoredPrediction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const clearPredictionHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

export interface ClusteredSegmentData {
  segment_name: string
  customer_count: number
  churn_rate: number
  avg_customer_value: number
  characteristics: string[]
  retention_strategy: string
}

export const saveClusteredSegments = (segments: ClusteredSegmentData[]): void => {
  localStorage.setItem(CLUSTERED_SEGMENTS_KEY, JSON.stringify(segments))
  console.log("[v0] Saved", segments.length, "clustered segments to localStorage")
}

export const getClusteredSegments = (): ClusteredSegmentData[] | null => {
  try {
    const stored = localStorage.getItem(CLUSTERED_SEGMENTS_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const clearClusteredSegments = (): void => {
  localStorage.removeItem(CLUSTERED_SEGMENTS_KEY)
}

export const getHistoryStats = () => {
  const history = getPredictionHistory()

  if (history.length === 0) {
    return {
      totalPredictions: 0,
      avgChurnRate: 0,
      riskDistribution: { URGENT: 0, MONITOR: 0, STABLE: 0 },
      recentTrend: [],
    }
  }

  const avgChurnRate = history.reduce((sum, p) => sum + p.result.churn_probability, 0) / history.length

  const riskDistribution = history.reduce(
    (acc, p) => {
      acc[p.result.risk_level] = (acc[p.result.risk_level] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Get last 10 predictions for trend
  const recentTrend = history
    .slice(0, 10)
    .reverse()
    .map((p) => ({
      timestamp: p.timestamp,
      churnRate: p.result.churn_probability * 100,
    }))

  return {
    totalPredictions: history.length,
    avgChurnRate: avgChurnRate * 100,
    riskDistribution,
    recentTrend,
  }
}
