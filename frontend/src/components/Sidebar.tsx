"use client"

import { LayoutDashboard, Search, History, FileText, Settings, TrendingUp, Users } from "lucide-react"

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" },
    { icon: Search, label: "Risk Analyzer", view: "risk-analyzer" },
    { icon: FileText, label: "Batch Predictor", view: "batch-predictor" },
    { icon: History, label: "Prediction History", view: "prediction-history" },
    { icon: Users, label: "Customer Segments", view: "customer-segments" },
    { icon: TrendingUp, label: "Analytics", view: "analytics" },
    { icon: FileText, label: "Reports", view: "reports" },
  ]

  return (
    <aside className="w-64 h-screen bg-slate border-r border-gold/15 flex flex-col sticky top-0">
      {/* Logo Section */}
      <div className="p-6 border-b border-gold/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-navy-dark" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ChurnGuard</h2>
            <p className="text-xs text-gray-400">Analytics Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.view
          return (
            <button
              key={item.label}
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "text-gray-400 hover:bg-surface-light hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gold/15">
        <button
          onClick={() => setActiveView("settings")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            activeView === "settings"
              ? "bg-gold/10 text-gold border border-gold/30"
              : "text-gray-400 hover:bg-surface-light hover:text-white"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>

        <div className="mt-4 p-3 rounded-lg bg-surface-light border border-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-xs font-semibold text-emerald">System Online</span>
          </div>
          <p className="text-xs text-gray-400">Models: Active</p>
          <p className="text-xs text-gray-400">API: Connected</p>
        </div>
      </div>
    </aside>
  )
}
