"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, EquiFlowABI } from '@/constants';
import TokenizeForm from '@/components/TokenizeForm';
import OpportunityDetailsModal from '@/components/OpportunityDetailsModal';

export default function DashboardPage() {
  const { account } = useWallet();
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [showTokenizeModal, setShowTokenizeModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);

  useEffect(() => {
    setCurrentTime(Date.now() / 1000);
    const interval = setInterval(() => setCurrentTime(Date.now() / 1000), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    if (account && typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, provider);

      try {
        const nextId = await contract.nextTokenId();
        const props = [];
        const investments = [];

        for (let i = 0; i < Number(nextId); i++) {
          const loan = await contract.loans(i);
          // Struct: 0:homeowner, 1:appraisal, 2:liquidity, 3:ipId, 4:isFunded, 5:equity, 6:duration, 7:deadline, 8:verified, 9:hash, 10:aiVal, 11:investor, 12:isRepaid, 13:propertyAddress

          const item = {
            id: i,
            homeowner: loan[0],
            appraisal: ethers.formatEther(loan[1]),
            liquidity: ethers.formatEther(loan[2]),
            isFunded: loan[4],
            deadline: Number(loan[7]),
            duration: Number(loan[6]) / 86400, // Convert seconds to days
            investor: loan[11],
            isRepaid: loan[12],
            propertyAddress: loan[13] // Fetch property address
          };

          // My Properties (Homeowner)
          if (loan[0].toLowerCase() === account.toLowerCase()) {
            props.push(item);
          }

          // My Investments (Investor)
          if (loan[11].toLowerCase() === account.toLowerCase()) {
            investments.push(item);
          }
        }
        setMyProperties(props);
        setMyInvestments(investments);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    }
  };

  useEffect(() => {
    if (account) fetchData();
  }, [account]);

  const handleTokenizeSuccess = () => {
    setShowTokenizeModal(false);
    fetchData();
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTokenizeModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const cancelListing = async (id: number) => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, signer);

      const tx = await contract.cancelListing(id);
      const toastId = toast.loading("Cancelling Listing...");
      await tx.wait();
      toast.success("Listing Cancelled!", { id: toastId });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error("Cancellation failed: " + (err.reason || err.message));
    }
  };

  const repayLoan = async (id: number, amount: string) => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, signer);

      const tx = await contract.repayLoan(id, { value: ethers.parseEther(amount) });
      const toastId = toast.loading("Repaying Loan...");
      await tx.wait();
      toast.success("Loan Repaid! Collateral Unlocked.", { id: toastId });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error("Repayment failed: " + (err.reason || err.message));
    }
  };

  const forecloseLoan = async (id: number) => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, signer);

      const tx = await contract.foreclose(id);
      const toastId = toast.loading("Foreclosing Property...");
      await tx.wait();
      toast.success("Foreclosure Successful! Property Seized.", { id: toastId });
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error("Foreclosure failed: " + (err.reason || err.message));
    }
  };

  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <Navbar />

      <div className="container mx-auto px-6 pt-32">

        {/* My Properties Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gradient">My Properties</h1>
          <button
            onClick={() => setShowTokenizeModal(true)}
            className="btn-primary"
          >
            Tokenize New Property
          </button>
        </div>

        {myProperties.length === 0 ? (
          <p className="text-gray-500 mb-12">No properties tokenized yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {myProperties.map((prop) => (
              <div
                key={prop.id}
                onClick={() => setSelectedOpportunity(prop)}
                className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden cursor-pointer hover:border-purple-500/30 transition-all group flex flex-col"
              >
                {prop.isRepaid && <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg z-10">REPAID</div>}

                <div className="flex justify-between items-start mb-4">
                  <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">#{prop.id}</span>
                  <span className={`text-sm ${prop.isFunded ? 'text-green-400' : 'text-yellow-400'}`}>
                    {prop.isFunded ? (prop.isRepaid ? 'Completed' : 'Funded') : 'Pending Funding'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-400 transition-colors">{prop.liquidity} IP</h3>
                <p className="text-gray-400 text-sm mb-6">Requested Liquidity</p>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Appraisal</span>
                    <span>{prop.appraisal} IP</span>
                  </div>
                  {prop.isFunded && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Deadline</span>
                      <span className={currentTime > prop.deadline && !prop.isRepaid ? "text-red-500 font-bold" : ""}>
                        {new Date(prop.deadline * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="relative z-20 mt-auto" onClick={(e) => e.stopPropagation()}>
                  {!prop.isFunded && (
                    <button onClick={() => cancelListing(prop.id)} className="w-full py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20">
                      Cancel Listing
                    </button>
                  )}

                  {prop.isFunded && !prop.isRepaid && (
                    <button onClick={() => repayLoan(prop.id, prop.liquidity)} className="w-full py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors border border-green-500/30 font-bold">
                      Repay Loan ({prop.liquidity} IP)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Investments Section */}
        {myInvestments.length > 0 && (
          <>
            <h2 className="text-3xl font-bold text-gradient mb-8 border-t border-white/10 pt-8">My Investments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myInvestments.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => setSelectedOpportunity(prop)}
                  className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden cursor-pointer hover:border-blue-500/30 transition-all group flex flex-col"
                >
                   {prop.isRepaid && <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg z-10">REPAID</div>}

                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">Investment</span>
                    <span className={`text-sm ${prop.isRepaid ? 'text-green-400' : 'text-blue-400'}`}>
                      {prop.isRepaid ? 'Paid Back' : 'Active Loan'}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{prop.liquidity} IP</h3>
                  <p className="text-gray-400 text-sm mb-6">Invested Amount</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Deadline</span>
                      <span className={currentTime > prop.deadline && !prop.isRepaid ? "text-red-500 font-bold" : ""}>
                        {new Date(prop.deadline * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-20 mt-auto" onClick={(e) => e.stopPropagation()}>
                    {!prop.isRepaid && currentTime > prop.deadline && (
                      <button onClick={() => forecloseLoan(prop.id)} className="w-full py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-bold animate-pulse">
                        ⚠️ FORECLOSE PROPERTY
                      </button>
                    )}

                    {!prop.isRepaid && currentTime <= prop.deadline && (
                      <div className="w-full py-2 text-center text-gray-500 text-sm italic">
                        Waiting for repayment...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {showTokenizeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div className="relative w-full max-w-md my-8">
              <TokenizeForm
                onSuccess={handleTokenizeSuccess}
                onClose={() => setShowTokenizeModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <OpportunityDetailsModal
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        opportunity={selectedOpportunity}
      />
    </main>
  );
}
