import axios from "axios"
import type {
  GlobalMetrics,
  PredictionRequest,
  PredictionResponse,
  FeatureImportance,
  ClusterDistribution,
  SegmentAnalysis,
} from "../types"

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

export const healthCheck = async (): Promise<{ status: string; model_loaded: boolean }> => {
  const response = await api.get("/health")
  return response.data
}

export const getGlobalMetrics = async (): Promise<GlobalMetrics> => {
  const response = await api.get("/metrics")
  return response.data
}

export const predictChurn = async (data: PredictionRequest): Promise<PredictionResponse> => {
  const response = await api.post("/predict", data)
  return response.data
}

export const getFeatureImportance = async (): Promise<FeatureImportance[]> => {
  const response = await api.get("/feature-importance")
  return response.data.feature_importance || []
}

export const getClusterDistribution = async (): Promise<ClusterDistribution[]> => {
  const response = await api.get("/cluster-distribution")
  return response.data.distribution || []
}

export const getSegmentAnalysis = async (): Promise<SegmentAnalysis[]> => {
  const response = await api.get("/segments")
  return response.data.segments || []
}

export default api
