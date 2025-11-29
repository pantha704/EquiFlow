"use client";
import { motion } from "framer-motion";
import { TrendingUp, Shield, ArrowUpRight } from "lucide-react";

const MOCK_LOANS = [
  { id: 1, address: "0x123...abc", appraisal: "850,000", liquidity: "85,000", equity: "10%" },
  { id: 2, address: "0x456...def", appraisal: "1,200,000", liquidity: "120,000", equity: "10%" },
  { id: 3, address: "0x789...ghi", appraisal: "650,000", liquidity: "65,000", equity: "10%" },
];

export default function LoanMarket() {
  return (
    <div className="py-20 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-3xl font-bold">Live Opportunities</h2>
        <button className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm font-medium transition-colors">
          View All <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_LOANS.map((loan, i) => (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="glass-panel p-6 rounded-2xl hover:bg-white/10 transition-colors group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                <Shield className="text-blue-400 w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                LIVE
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Homeowner</p>
                <p className="font-mono text-sm text-gray-300">{loan.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Appraisal</p>
                  <p className="font-bold text-lg">${loan.appraisal}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Liquidity</p>
                  <p className="font-bold text-lg text-purple-400">${loan.liquidity}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Est. APY</span>
                </div>
                <span className="font-bold text-green-400">~12.5%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
