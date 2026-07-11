"use client"

import { Download } from "lucide-react"

export default function SampleDataDownload() {
  const downloadSampleData = (size: "small" | "large") => {
    const filename = size === "small" ? "sample_customers.csv" : "sample_customers_large.csv"
    const link = document.createElement("a")
    link.href = `/${filename}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="glass-premium rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Sample Data for Testing</h3>
          <p className="text-sm text-gray-400">Download sample CSV files to test clustering</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => downloadSampleData("small")}
          className="px-4 py-2 bg-surface-light border border-gold/30 text-gold rounded-lg hover:bg-gold/10 transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Small Sample (15 customers)
        </button>
        <button
          onClick={() => downloadSampleData("large")}
          className="px-4 py-2 bg-surface-light border border-gold/30 text-gold rounded-lg hover:bg-gold/10 transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Large Sample (25 customers)
        </button>
      </div>
    </div>
  )
}
