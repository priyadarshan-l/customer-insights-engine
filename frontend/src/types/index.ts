export interface GlobalMetrics {
  total_customers: number
  churn_rate: number
  model_accuracy: number
  segments: {
    [key: string]: {
      count: number
      churn_rate: number
      avg_value: number
    }
  }
}

export interface PredictionRequest {
  Recency: number
  MntMeatProducts: number
  NumWebVisitsMonth: number
  Marital_Status: string
  Education: string
  MntGoldProds: number
  NumStorePurchases: number
  MntWines: number
  Teenhome: number
  AcceptedCmp1: number
  AcceptedCmp2: number
  AcceptedCmp3: number
  AcceptedCmp4: number
  AcceptedCmp5: number
}

export interface PredictionResponse {
  churn_prediction: number
  churn_probability: number
  cluster: number
  risk_level: "URGENT" | "MONITOR" | "STABLE"
  segment: string
}

export interface FeatureImportance {
  feature: string
  importance: number
}

export interface ClusterDistribution {
  cluster: number
  count: number
  percentage: number
}

export interface SegmentAnalysis {
  segment_name: string
  customer_count: number
  churn_rate: number
  avg_customer_value: number
  characteristics: string[]
  retention_strategy: string
}
