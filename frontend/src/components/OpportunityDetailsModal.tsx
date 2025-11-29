import { useEffect } from 'react';

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, ShieldCheck, Clock, DollarSign } from "lucide-react";
import { generateLegalContract } from "@/utils/legalGenerator";
import { toast } from "react-hot-toast";

interface OpportunityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: any;
}

export default function OpportunityDetailsModal({ isOpen, onClose, opportunity }: OpportunityDetailsModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !opportunity) return null;

  const handleDownloadContract = async () => {
    try {
      const toastId = toast.loading("Retrieving Legal Contract...");

      // Re-generate the contract using the on-chain data
      // Note: In a production app with IPFS, we would fetch the hash/CID here.
      // Since we are using deterministic generation based on the agreed terms:
      const { blob } = await generateLegalContract(
        opportunity.homeowner,
        opportunity.appraisal,
        opportunity.liquidity,
        opportunity.duration,
        opportunity.propertyAddress || "Address not provided" // Pass property address
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EquiFlow_Agreement_${opportunity.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Contract Downloaded!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to download contract");
    }
  };

  if (!opportunity) return null; // Ensure opportunity data is available before rendering

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h2 className="text-2xl font-bold text-white">Investment Opportunity #{opportunity.id}</h2>
                <p className="text-gray-400 text-sm mt-1">View details and legal documentation</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

              {/* Property Address Section */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-1">Property Location</h3>
                <p className="text-lg text-white font-medium">{opportunity.propertyAddress || "Address not provided"}</p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <DollarSign className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-gray-400 text-sm">Liquidity</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{opportunity.liquidity} IP</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-gray-400 text-sm">Appraisal</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{opportunity.appraisal} IP</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-gray-400 text-sm">Duration</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{opportunity.duration} Days</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-gray-400 text-sm">Status</span>
                  </div>
                  <p className={`text-2xl font-bold ${opportunity.isRepaid ? 'text-green-400' : (opportunity.isFunded ? 'text-blue-400' : 'text-yellow-400')}`}>
                    {opportunity.isRepaid ? 'Repaid' : (opportunity.isFunded ? 'Active' : 'Open')}
                  </p>
                </div>
              </div>

              {/* Legal Contract Section */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <FileText className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Legal Contract & Terms</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      This opportunity is backed by a cryptographically generated legal agreement.
                      You can view the full terms, conditions, and collateral details below.
                    </p>
                    <button
                      onClick={handleDownloadContract}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all text-sm font-medium text-white group"
                    >
                      <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Download Signed Agreement (PDF)
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Homeowner Address: <span className="font-mono text-gray-400">{opportunity.homeowner}</span></p>
                {opportunity.investor !== "0x0000000000000000000000000000000000000000" && (
                  <p>Investor Address: <span className="font-mono text-gray-400">{opportunity.investor}</span></p>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
