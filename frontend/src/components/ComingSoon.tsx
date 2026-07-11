import { Sparkles } from "lucide-react"

export default function ComingSoon() {
  return (
    <div className="glass rounded-2xl p-8 text-center border-2 border-gold/30 animate-fade-in">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-navy" />
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
        Behavioral Intelligence System
      </h3>
      <p className="text-gray-400 mb-4">Advanced AI-powered customer behavior analysis and predictive insights</p>
      <div className="inline-block bg-gold/10 border border-gold/30 rounded-full px-6 py-2">
        <span className="text-gold font-semibold">Coming Soon</span>
      </div>
    </div>
  )
}
