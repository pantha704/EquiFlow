
"use client";
import { useState } from 'react';
import { Home, DollarSign, ArrowRight, Loader2, Clock, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { generateLegalContract } from '@/utils/legalGenerator';
import { BrainCircuit, CheckCircle, AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers'; // Assuming ethers is available globally or imported
import { CONTRACT_ADDRESS, EquiFlowABI } from '@/constants'; // Reverting to alias import

interface TokenizeFormProps {
  account: string | null;
  onSuccess?: () => void;
}

export default function TokenizeForm({ account, onSuccess }: TokenizeFormProps) {
  const [durationUnit, setDurationUnit] = useState("months"); // Still used for conversion

  const [formData, setFormData] = useState({
    propertyAddress: "",
    appraisalValue: "",
    requestedLiquidity: "",
    duration: "12", // Default to 12
    deedFile: null as File | null,
  });
  const [aiValuation, setAiValuation] = useState<number | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Internal state for processing

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).files?.[0] || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAnalyze = async () => {
    if (!formData.propertyAddress) return toast.error("Enter property address first");
    if (!formData.deedFile) return toast.error("Upload Property Deed first for AI verification");

    setIsAnalyzing(true);
    setAiValuation(null);
    setAiReasoning(null);
    setIsVerified(false);

    try {
      const data = new FormData();
      data.append("file", formData.deedFile);
      data.append("address", formData.propertyAddress);

      const res = await fetch("/api/valuation", {
        method: "POST",
        body: data,
      });

      const result = await res.json();

      if (result.error) throw new Error(result.error);

      setAiValuation(result.estimatedValue);
      setAiReasoning(result.reasoning);
      setIsVerified(result.isVerified);

      if (result.isVerified) {
        toast.success(`Verified! Est. Value: $${result.estimatedValue.toLocaleString()}`);
      } else {
        toast.error(`Verification Failed: ${result.verificationReason}`);
      }

    } catch (err: any) {
      console.error(err);
      toast.error("AI Analysis Failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTokenize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) {
      toast.error("Connect wallet first");
      return;
    }

    // Validation
    const liquidity = Number(formData.requestedLiquidity);
    const appraisal = Number(formData.appraisalValue);
    const durationValue = Number(formData.duration);

    if (!appraisal || !liquidity || !durationValue || !formData.propertyAddress) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (aiValuation && appraisal > aiValuation * 1.2) {
       toast("Warning: Your appraisal is significantly higher than AI estimate.", { icon: "⚠️" });
    }

    if (!isVerified && aiValuation) {
        toast("Warning: Property document was not verified by AI.", { icon: "⚠️" });
    }

    if (liquidity <= 0) {
      toast.error("Liquidity must be greater than 0");
      return;
    }
    if (liquidity > appraisal) {
      toast.error("Liquidity cannot exceed Appraisal Value");
      return;
    }
    if (durationValue <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }
    if (!formData.deedFile) {
      toast.error("Please upload a Proof of Ownership (Deed).");
      return;
    }

    setIsProcessing(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, signer);

      // Convert duration to days
      let totalDays = durationValue;
      if (durationUnit === "months") totalDays *= 30;
      if (durationUnit === "years") totalDays *= 365;

      // 1. Generate Legal Contract
      const toastGenId = toast.loading("Generating Legal Contract...");
      const { blob, hash } = await generateLegalContract(
        account,
        formData.appraisalValue,
        formData.requestedLiquidity,
        totalDays, // Pass total days
        formData.propertyAddress // Pass property address
      );
      toast.success("Legal Contract Generated!", { id: toastGenId });

      // 2. Download PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EquiFlow_Agreement_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the object URL

      // 3. Submit to Blockchain
      const durationSeconds = BigInt(totalDays * 86400);
      const aiValuationBigInt = ethers.parseEther(aiValuation ? aiValuation.toString() : "0");

      console.log("Tokenizing with args:", {
        tokenURI: "ipfs://mock-metadata",
        appraisalValue: ethers.parseEther(formData.appraisalValue),
        requestedLiquidity: ethers.parseEther(formData.requestedLiquidity),
        duration: durationSeconds,
        documentHash: hash,
        aiValuation: aiValuationBigInt,
        propertyAddress: formData.propertyAddress
      });



      // 3. Submit to Blockchain
      // Converting all numbers to strings to satisfy Ethers v6 robustly
      const tx = await contract.tokenizeHome(
        "ipfs://mock-metadata",
        ethers.parseEther(formData.appraisalValue).toString(),
        ethers.parseEther(formData.requestedLiquidity).toString(),
        durationSeconds.toString(),
        hash,
        aiValuationBigInt.toString(),
        formData.propertyAddress
      );

      const toastId = toast.loading("Minting IP Asset...");
      await tx.wait();

      toast.success(
        <div className="flex flex-col gap-1">
          <span>Property Tokenized Successfully!</span>
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

      // Reset form
      setFormData({ propertyAddress: '', appraisalValue: '', requestedLiquidity: '', duration: '12', deedFile: null });
      setAiValuation(null);
      setAiReasoning(null);
      setIsVerified(false);
      setDurationUnit("months");

      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error(err);
      toast.error("Transaction failed: " + (err.reason || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-8 rounded-3xl max-w-md mx-auto w-full border border-white/10 relative overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/20 rounded-xl">
          <Home className="text-purple-400 w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Tokenize Property</h3>
          <p className="text-sm text-gray-400">Create IP Asset</p>
        </div>
      </div>

      <form onSubmit={handleTokenize} className="space-y-6">

        {/* Address & AI Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Property Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="propertyAddress"
              value={formData.propertyAddress}
              onChange={handleInputChange}
              placeholder="123 Blockchain Blvd, Crypto City"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              required
            />
          </div>
        </div>

        {/* File Upload - Moved Up for Better Flow */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Proof of Ownership (Deed)</label>
          <div className="relative">
            <input
              type="file"
              name="deedFile"
              onChange={handleInputChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30 cursor-pointer bg-white/5 rounded-xl border border-white/10"
              required
            />
          </div>
          <p className="text-xs text-gray-500 ml-1">Upload PDF or Image of your property deed.</p>
        </div>

        {/* AI Analyze Button */}
        <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !formData.propertyAddress || !formData.deedFile}
            className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 text-purple-300 py-3 rounded-xl border border-purple-500/30 transition-all flex items-center justify-center gap-2"
        >
            {isAnalyzing ? (
            <span className="animate-pulse">Verifying Document with Gemini AI...</span>
            ) : (
            <>
                <BrainCircuit className="w-5 h-5" />
                Verify & Valuate with Gemini AI
            </>
            )}
        </button>

        {aiValuation && (
            <div className={`p-4 rounded-xl border ${isVerified ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                    {isVerified ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                    <span className={`font-bold ${isVerified ? 'text-green-400' : 'text-red-400'}`}>
                        {isVerified ? 'Document Verified' : 'Verification Failed'}
                    </span>
                </div>
                <div className="text-sm text-gray-300 mb-1">
                    <span className="text-gray-500">AI Valuation:</span> <span className="font-bold text-white">{aiValuation.toLocaleString()} IP</span>
                </div>
                {aiReasoning && (
                    <p className="text-xs text-gray-400 italic">"{aiReasoning}"</p>
                )}
            </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Appraisal Value (IP)</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="number"
              name="appraisalValue"
              value={formData.appraisalValue}
              onChange={handleInputChange}
              className="input-field !pl-12 w-full"
              placeholder="500,000"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Requested Liquidity (IP)</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="number"
              name="requestedLiquidity"
              value={formData.requestedLiquidity}
              onChange={handleInputChange}
              className="input-field !pl-12 w-full"
              placeholder="50,000"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300 ml-1">Loan Duration</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="input-field !pl-12 w-full"
                placeholder="Duration"
                required
              />
            </div>
            <select
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-purple-500 transition-colors w-32"
            >
              <option value="days" className="bg-black">Days</option>
              <option value="months" className="bg-black">Months</option>
              <option value="years" className="bg-black">Years</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full btn-primary flex items-center justify-center gap-2 group"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Mint & Register IP
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );

}
