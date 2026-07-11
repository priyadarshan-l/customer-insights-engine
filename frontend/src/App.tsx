"use client"

import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import ExecutiveOverview from "./components/ExecutiveOverview"
import RiskAnalyzer from "./components/RiskAnalyzer"
import SegmentCards from "./components/SegmentCards"
import TechnicalInsights from "./components/TechnicalInsights"
import ComingSoon from "./components/ComingSoon"
import BatchPredictor from "./components/BatchPredictor"
import PredictionHistory from "./components/PredictionHistory"
import RiskDistributionChart from "./components/RiskDistributionChart"
import PredictionTrendChart from "./components/PredictionTrendChart"
import CustomerSegments from "./components/CustomerSegments"
import { useState } from "react"

function App() {
  const [activeView, setActiveView] = useState("dashboard")

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <>
            <ExecutiveOverview />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PredictionTrendChart />
              <RiskDistributionChart />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SegmentCards />
              <TechnicalInsights />
            </div>
          </>
        )
      case "risk-analyzer":
        return <RiskAnalyzer />
      case "batch-predictor":
        return <BatchPredictor />
      case "prediction-history":
        return <PredictionHistory />
      case "customer-segments":
        return <CustomerSegments onNavigateToPredictor={() => setActiveView("batch-predictor")} />
      case "analytics":
        return (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PredictionTrendChart />
              <RiskDistributionChart />
            </div>
            <TechnicalInsights />
          </>
        )
      case "reports":
        return <ComingSoon />
      case "settings":
        return <ComingSoon />
      default:
        return <ExecutiveOverview />
    }
  }

  return (
    <div className="flex min-h-screen bg-background grid-background">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">{renderView()}</div>
        </main>

        <footer className="border-t border-gold/15 bg-surface/50 backdrop-blur-sm py-4 px-6">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <p>© 2025 ChurnGuard Analytics. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <p>Powered by XGBoost & K-Means ML</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                <span className="text-emerald">Live</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
