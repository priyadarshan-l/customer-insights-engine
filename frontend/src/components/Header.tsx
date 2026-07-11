import { Bell, User, SearchIcon } from "lucide-react"

export default function Header() {
  return (
    <header className="h-16 bg-surface border-b border-gold/15 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers, predictions, reports..."
            className="w-full bg-navy-light border border-gold/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-surface-light transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red rounded-full" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gold/15">
          <div className="text-right">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-400">Data Analyst</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
            <User className="w-5 h-5 text-navy-dark" />
          </div>
        </div>
      </div>
    </header>
  )
}
