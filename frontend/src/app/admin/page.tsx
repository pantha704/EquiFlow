"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { useWallet } from '@/context/WalletContext';
import { CONTRACT_ADDRESS, EquiFlowABI } from '@/constants';
import { CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';

import { generateLegalContract } from '@/utils/legalGenerator';

export default function AdminPage() {
  const { account } = useWallet();
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwner = async () => {
      if (account && typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, provider);
          const owner = await contract.owner();
          if (owner.toLowerCase() === account.toLowerCase()) {
            setIsOwner(true);
          } else {
            console.warn("User is not the contract owner");
            setIsOwner(false);
          }
        } catch (e) {
          console.error("Failed to fetch owner", e);
        }
      }
    };
    checkOwner();
  }, [account]);

  useEffect(() => {
    const fetchData = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, provider);

        try {
          const nextId = await contract.nextTokenId();
          const pending = [];

          for (let i = 0; i < Number(nextId); i++) {
            const loan = await contract.loans(i);
            // Check if NOT verified
            if (!loan.isVerified && loan.homeowner !== ethers.ZeroAddress) {
              pending.push({
                id: i,
                homeowner: loan.homeowner,
                appraisal: ethers.formatEther(loan.appraisalValue),
                liquidity: ethers.formatEther(loan.requestedLiquidity),
                duration: Number(loan.duration) / 86400, // days
                propertyAddress: loan.propertyAddress // Fetch property address
              });
            }
          }
          setPendingListings(pending);
        } catch (err) {
          console.error("Error fetching admin data:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [account]);

  const verifyListing = async (id: number) => {
    if (!account) return toast.error("Please connect wallet");
    if (!isOwner) return toast.error("Only the contract owner can verify listings");

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, signer);

      console.log(`Verifying listing ${id}...`);
      const tx = await contract.verifyListing(id);
      const toastId = toast.loading("Verifying Listing...");
      await tx.wait();

      toast.success(
        <div className="flex flex-col gap-1">
          <span>Listing Verified!</span>
          <a
            href={`https://aeneid.storyscan.io/tx/${tx.hash}`}
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
      toast.error("Verification failed: " + (err.reason || err.message || "Unknown error"));
    }
  };

  const handleViewDocument = async (loan: any) => {
    try {
      const toastId = toast.loading("Generating Document...");
      const { blob } = await generateLegalContract(
        loan.homeowner,
        loan.appraisal,
        loan.liquidity,
        loan.duration,
        loan.propertyAddress || "Address not provided" // Pass property address
      );
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success("Document Opened", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate document");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <Navbar />

      <div className="container mx-auto px-6 pt-32">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gradient">Admin Verification</h1>
            <p className="text-gray-400 mt-2">Review and approve pending property listings</p>
            {!isOwner && account && (
              <p className="text-red-500 text-sm mt-2">⚠️ You are not the contract owner. You cannot verify listings.</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading pending listings...</div>
        ) : pendingListings.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl border border-white/10">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
            <p className="text-gray-400">No pending listings to verify.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingListings.map((prop) => (
              <div key={prop.id} className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldCheck className="w-24 h-24 text-blue-500" />
                </div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Pending Verification
                  </span>
                  <span className="text-gray-500 text-sm">#{prop.id}</span>
                </div>

                <div className="space-y-4 relative z-10 mb-8">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Homeowner</p>
                    <p className="font-mono text-sm truncate text-blue-300 bg-blue-500/10 p-2 rounded-lg">
                      {prop.homeowner}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Appraisal</p>
                      <p className="font-bold text-lg">{prop.appraisal} IP</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Request</p>
                      <p className="font-bold text-lg">{prop.liquidity} IP</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Duration</p>
                    <p className="font-medium">{prop.duration} Days</p>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Documents</p>
                    <div
                      onClick={() => handleViewDocument(prop)}
                      className="flex items-center gap-2 text-sm text-blue-400 cursor-pointer hover:underline"
                    >
                      📄 View Signed Deed (PDF)
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10 mt-auto">
                  <button
                    onClick={() => verifyListing(prop.id)}
                    disabled={!isOwner}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isOwner
                        ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    {isOwner ? "Verify" : "Auth"}
                  </button>

                  <button
                    onClick={() => {
                        if(!isOwner) return toast.error("Only the contract owner can reject listings");
                        const confirm = window.confirm("Are you sure you want to reject this listing? This action cannot be undone.");
                        if (confirm) {
                            const rejectListing = async () => {
                                try {
                                    const provider = new ethers.BrowserProvider((window as any).ethereum);
                                    const signer = await provider.getSigner();
                                    const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, signer);

                                    console.log(`Rejecting listing ${prop.id}...`);
                                    const tx = await contract.cancelListing(prop.id);
                                    const toastId = toast.loading("Rejecting Listing...");
                                    await tx.wait();

                                    toast.success("Listing Rejected", { id: toastId });
                                    setTimeout(() => window.location.reload(), 2000);
                                } catch (err: any) {
                                    console.error(err);
                                    toast.error("Rejection failed: " + (err.reason || err.message || "Unknown error"));
                                }
                            };
                            rejectListing();
                        }
                    }}
                    disabled={!isOwner}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isOwner
                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed border border-transparent"
                    }`}
                  >
                    <AlertCircle className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
