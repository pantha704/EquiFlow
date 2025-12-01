
"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, EquiFlowABI, RPC_URL } from '@/constants';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

import OpportunityDetailsModal from '@/components/OpportunityDetailsModal';

export default function MarketPage() {
  const { account } = useWallet();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      let provider;
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        provider = new ethers.BrowserProvider((window as any).ethereum);
      } else {
        provider = new ethers.JsonRpcProvider(RPC_URL);
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, provider);

      try {
        const nextId = await contract.nextTokenId();
        const fetchedLoans = [];

        for (let i = 0; i < Number(nextId); i++) {
          const loan = await contract.loans(i);
          // loan structure: [homeowner, appraisalValue, requestedLiquidity, ipId, isFunded, equityShareBps, duration, deadline, isVerified, aiValuation]
          // Check if not funded AND verified
          if (!loan.isFunded && loan.isVerified && loan.homeowner !== ethers.ZeroAddress) {
            const appraisal = ethers.formatEther(loan.appraisalValue);
            const liquidity = ethers.formatEther(loan.requestedLiquidity);
            const aiVal = ethers.formatEther(loan.aiValuation);

            const isHighRisk = Number(liquidity) > Number(aiVal);

            fetchedLoans.push({
              id: i,
              homeowner: loan.homeowner, // Ensure homeowner is passed
              appraisal: appraisal,
              liquidity: liquidity,
              duration: Number(loan.duration) / 86400, // days
              propertyAddress: loan.propertyAddress, // Fetch property address
              isHighRisk: isHighRisk,
              aiValuation: aiVal,
              isFunded: loan.isFunded,
              isRepaid: loan.isRepaid,
              investor: loan.investor
            });
          }
        }
        setLoans(fetchedLoans);
      } catch (err) {
        console.error("Error fetching loans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const fundLoan = async (id: number, amount: string) => {
    if (!account) return alert("Connect wallet first");
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, signer);

      console.log("Funding Loan:", { id, amount });

      // Pre-flight check
      const loanData = await contract.loans(id);
      console.log("Pre-flight Loan Data:", {
        isVerified: loanData.isVerified,
        isFunded: loanData.isFunded,
        requestedLiquidity: loanData.requestedLiquidity.toString(),
        homeowner: loanData.homeowner
      });

      if (!loanData.isVerified) {
        toast.error("Loan is not verified on-chain yet!");
        return;
      }

      const parsedValue = ethers.parseEther(amount);
      console.log("Parsed Value:", parsedValue, typeof parsedValue);

      // Check user balance
      const balance = await provider.getBalance(await signer.getAddress());
      console.log("User Balance:", balance.toString());

      if (balance < parsedValue) {
        toast.error(`Insufficient funds! You need ${amount} IP but have ${ethers.formatEther(balance)} IP.`);
        return;
      }

      const tx = await contract.fundHome(id, 1, { value: parsedValue.toString() });

      const toastId = toast.loading("Funding Loan...");
      await tx.wait();
      const explorerUrl = `https://aeneid.storyscan.io/tx/${tx.hash}`;
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Loan Funded Successfully!</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline opacity-80 hover:opacity-100"
          >
            View on Explorer
          </a>
        </div>,
        { id: toastId }
      );

      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      console.error(err);
      toast.error("Funding failed: " + (err.reason || err.message));
    }
  };

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <Navbar />

      <div className="container mx-auto px-6 pt-32">
        <h1 className="text-4xl font-bold mb-8 text-gradient">Investment Market</h1>

        {loading ? (
          <div className="text-center py-20">Loading opportunities...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loans.map((loan) => (
              <div
                key={loan.id}
                onClick={() => setSelectedOpportunity(loan)}
                className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-purple-500/30 transition-all cursor-pointer flex flex-col h-full"
              >
                {loan.isHighRisk && (
                  <div className="absolute top-0 right-0 bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-red-500/20 flex items-center gap-1 z-20">
                    <AlertTriangle className="w-3 h-3" />
                    High Risk
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                    #{loan.id}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {loan.duration} Days Term
                  </span>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1 group-hover:text-purple-400 transition-colors">{loan.liquidity} IP</h3>
                    <p className="text-gray-400 text-sm">Requested Liquidity</p>
                  </div>
                  <div className="text-right max-w-[50%]">
                    <p className="text-sm font-medium text-white truncate" title={loan.propertyAddress}>{loan.propertyAddress}</p>
                    <p className="text-xs text-gray-500">Location</p>
                  </div>
                </div>

                <div className="space-y-4 relative z-10 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Appraisal</span>
                    <span>{loan.appraisal} IP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">LTV Ratio</span>
                    <span>{((Number(loan.liquidity) / Number(loan.appraisal)) * 100).toFixed(1)}%</span>
                  </div>
                  {loan.isHighRisk && (
                    <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20 mt-2">
                      ⚠️ Request exceeds AI Valuation ({Number(loan.aiValuation).toLocaleString()} IP)
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fundLoan(loan.id, loan.liquidity);
                  }}
                  className="w-full btn-primary relative z-20 mt-auto"
                >
                  Fund Loan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <OpportunityDetailsModal
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        opportunity={selectedOpportunity}
      />
    </main>
  );
}

