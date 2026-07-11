"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Download, AlertCircle, CheckCircle2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { savePrediction } from "../utils/storage"
import { API_BASE_URL } from "../services/api"

interface CustomerInput {
  Recency: number
  NumWebVisitsMonth: number
  MntMeatProducts: number
  MntGoldProds: number
  MntWines: number
  Education: string
  Marital_Status: string
  NumStorePurchases?: number
  Teenhome?: number
}

interface PredictionResult extends CustomerInput {
  churn_probability: number
  risk_level: string
  segment: string
  cluster_id: number
  status: "success" | "error"
  error?: string
}

export default function BatchPredictor() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<PredictionResult[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 20

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile)
      setError(null)
    } else {
      setError("Please upload a valid CSV file")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const parseCSV = (text: string): CustomerInput[] => {
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())

    const columnMapping: Record<string, string[]> = {
      Recency: ["Recency", "recency", "RECENCY"],
      NumWebVisitsMonth: ["NumWebVisitsMonth", "Web Visits", "WebVisits", "NumWebVisits", "WEB_VISITS"],
      MntMeatProducts: ["MntMeatProducts", "Meat Products", "MeatProducts", "Mnt_Meat", "MEAT"],
      MntGoldProds: ["MntGoldProds", "Gold Products", "GoldProducts", "Mnt_Gold", "GOLD"],
      MntWines: ["MntWines", "Wines", "Wine", "Mnt_Wines", "WINES"],
      Education: ["Education", "education", "EDUCATION"],
      Marital_Status: ["Marital_Status", "Marital Status", "MaritalStatus", "Marital", "MARITAL_STATUS"],
      NumStorePurchases: ["NumStorePurchases", "Store Purchases", "StorePurchases", "STORE_PURCHASES"],
      Teenhome: ["Teenhome", "Teen Home", "TeenHome", "TEENHOME"],
    }

    const columnMap: Record<string, string> = {}
    for (const [targetCol, possibleNames] of Object.entries(columnMapping)) {
      const found = headers.find((h) => possibleNames.some((name) => h.toLowerCase() === name.toLowerCase()))
      if (found) {
        columnMap[targetCol] = found
      }
    }

    const requiredCols = [
      "Recency",
      "NumWebVisitsMonth",
      "MntMeatProducts",
      "MntGoldProds",
      "MntWines",
      "Education",
      "Marital_Status",
    ]
    const missingCols = requiredCols.filter((col) => !columnMap[col])

    if (missingCols.length > 0) {
      throw new Error(`Missing required columns: ${missingCols.join(", ")}. Found columns: ${headers.join(", ")}`)
    }

    const customers: CustomerInput[] = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(",").map((v) => v.trim())
      const customer: any = {}

      headers.forEach((header, index) => {
        customer[header] = values[index]
      })

      customers.push({
        Recency: Number(customer[columnMap.Recency]) || 0,
        NumWebVisitsMonth: Number(customer[columnMap.NumWebVisitsMonth]) || 0,
        MntMeatProducts: Number(customer[columnMap.MntMeatProducts]) || 0,
        MntGoldProds: Number(customer[columnMap.MntGoldProds]) || 0,
        MntWines: Number(customer[columnMap.MntWines]) || 0,
        Education: customer[columnMap.Education] || "Graduate",
        Marital_Status: customer[columnMap.Marital_Status] || "Single",
        NumStorePurchases: Number(customer[columnMap.NumStorePurchases]) || 0,
        Teenhome: Number(customer[columnMap.Teenhome]) || 0,
      })
    }

    return customers
  }

  const processBatch = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)
    setResults([])
    setCurrentPage(1)

    try {
      const text = await file.text()
      const customers = parseCSV(text)

      console.log("[v0] Parsed customers:", customers.length)
      setProgress({ current: 0, total: customers.length })

      const batchSize = 5
      const allResults: PredictionResult[] = []

      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize)
        const promises = batch.map(async (customer) => {
          try {
            console.log("[v0] Predicting for customer:", customer)
            const response = await fetch(`${API_BASE_URL}/predict`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(customer),
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
              console.error("[v0] Prediction API error:", errorData)
              throw new Error(errorData.detail || "Prediction failed")
            }

            const data = await response.json()
            console.log("[v0] Prediction success:", data)

            savePrediction(customer, data)

            return {
              ...customer,
              churn_probability: data.churn_probability * 100,
              risk_level: data.risk_level,
              segment: data.segment,
              cluster_id: data.cluster_id || data.cluster,
              status: "success" as const,
            }
          } catch (err) {
            console.error("[v0] Batch prediction error:", err)
            return {
              ...customer,
              churn_probability: 0,
              risk_level: "Error",
              segment: "Error",
              cluster_id: -1,
              status: "error" as const,
              error: err instanceof Error ? err.message : "Unknown error",
            }
          }
        })

        const batchResults = await Promise.all(promises)
        allResults.push(...batchResults)
        setProgress({ current: allResults.length, total: customers.length })
        setResults([...allResults])
      }

      console.log("[v0] Batch processing complete. Success:", allResults.filter((r) => r.status === "success").length)
      console.log(
        "[v0] Saved",
        allResults.filter((r) => r.status === "success").length,
        "predictions to localStorage for analytics",
      )
      setIsProcessing(false)
    } catch (err) {
      console.error("[v0] CSV processing error:", err)
      setError(err instanceof Error ? err.message : "Failed to process CSV")
      setIsProcessing(false)
    }
  }

  const exportResults = () => {
    if (results.length === 0) return

    const headers = [
      "Recency",
      "NumWebVisitsMonth",
      "MntMeatProducts",
      "MntGoldProds",
      "MntWines",
      "Education",
      "Marital_Status",
      "Churn_Probability",
      "Risk_Level",
      "Segment",
      "Cluster_ID",
      "Status",
    ]
    const rows = results.map((r) => [
      r.Recency,
      r.NumWebVisitsMonth,
      r.MntMeatProducts,
      r.MntGoldProds,
      r.MntWines,
      r.Education,
      r.Marital_Status,
      r.churn_probability.toFixed(2),
      r.risk_level,
      r.segment,
      r.cluster_id,
      r.status,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `predictions_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "urgent":
        return "text-red-400"
      case "monitor":
        return "text-orange-400"
      case "stable":
        return "text-emerald-400"
      default:
        return "text-gray-400"
    }
  }

  const totalPages = Math.ceil(results.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentResults = results.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="glass-premium rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white">Batch Predictions</h3>
            <p className="text-sm text-gray-400 mt-1">Upload a CSV file to analyze multiple customers at once</p>
          </div>
          {results.length > 0 && (
            <button
              onClick={exportResults}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg transition-all duration-300 hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export Results</span>
            </button>
          )}
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? "border-gold bg-gold/5" : "border-gray-600 hover:border-gold/50"
          }`}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-white mb-2">{file ? file.name : "Drag and drop your CSV file here"}</p>
          <p className="text-sm text-gray-400 mb-4">or</p>
          <label className="inline-block px-4 py-2 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg cursor-pointer transition-colors">
            Browse Files
            <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          </label>
          {file && (
            <button onClick={() => setFile(null)} className="ml-2 p-2 text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-4 p-4 bg-navy/50 rounded-lg">
          <p className="text-sm text-gray-300 mb-2">Required CSV columns (flexible naming):</p>
          <code className="text-xs text-gold block">
            Recency, NumWebVisitsMonth (or Web Visits), MntMeatProducts (or Meat Products),
          </code>
          <code className="text-xs text-gold block mt-1">
            MntGoldProds (or Gold Products), MntWines (or Wines), Education, Marital_Status (or Marital Status)
          </code>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {file && !isProcessing && results.length === 0 && (
          <button
            onClick={processBatch}
            className="mt-4 w-full py-3 bg-gold hover:bg-gold/90 text-navy font-semibold rounded-lg transition-colors"
          >
            Process Batch Predictions
          </button>
        )}

        {isProcessing && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Processing...</span>
              <span className="text-white">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="glass-premium rounded-2xl overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-gold/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Results ({results.length} customers)</h3>
            </div>
            <div className="text-sm text-gray-400">
              Success: {results.filter((r) => r.status === "success").length} | Errors:{" "}
              {results.filter((r) => r.status === "error").length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Recency</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Web Visits</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Education</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Marital Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Churn %</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Risk Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentResults.map((result, index) => (
                  <tr key={startIndex + index} className="hover:bg-navy/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{result.Recency}</td>
                    <td className="px-4 py-3 text-sm text-white">{result.NumWebVisitsMonth}</td>
                    <td className="px-4 py-3 text-sm text-white">{result.Education}</td>
                    <td className="px-4 py-3 text-sm text-white">{result.Marital_Status}</td>
                    <td className="px-4 py-3 text-sm text-white font-semibold">
                      {result.status === "success" ? `${result.churn_probability.toFixed(1)}%` : "-"}
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold ${getRiskColor(result.risk_level)}`}>
                      {result.risk_level}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{result.segment}</td>
                    <td className="px-4 py-3">
                      {result.status === "success" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">
                          <AlertCircle className="w-3 h-3" />
                          Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gold/15 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, results.length)} of {results.length} results
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-surface-light hover:bg-gold/10 text-gray-400 hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-3 py-1 text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-gold text-navy"
                            : "bg-surface-light text-gray-400 hover:bg-gold/10 hover:text-gold"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-surface-light hover:bg-gold/10 text-gray-400 hover:text-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
