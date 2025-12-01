"use client";
import { useState } from 'react';
import { Home, DollarSign, ArrowRight, Loader2, Clock, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { generateLegalContract } from '@/utils/legalGenerator';
import { BrainCircuit, CheckCircle, AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, EquiFlowABI } from '@/constants';
import { verifyDocumentAction } from '@/actions/verifyDocument';

import { useWallet } from '@/context/WalletContext';

interface TokenizeFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function TokenizeForm({ onSuccess, onClose }: TokenizeFormProps) {
  const { account } = useWallet();
  const [durationUnit, setDurationUnit] = useState("months");

  const [formData, setFormData] = useState({
    propertyAddress: "",
    appraisalValue: "",
    requestedLiquidity: "",
    duration: "",
    deedFile: null as File | null
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiValuation, setAiValuation] = useState<number | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "deedFile" && files) {
      setFormData(prev => ({ ...prev, deedFile: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAnalyze = async () => {
    if (!formData.deedFile || !formData.propertyAddress) {
        toast.error("Please provide property address and deed file.");
        return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading("Analyzing document with Gemini AI...");

    try {
        const data = new FormData();
        data.append("file", formData.deedFile);

        const result = await verifyDocumentAction(data);

        if (result.verified) {
            setIsVerified(true);
            setAiValuation(result.valuation);
            setAiReasoning(result.reasoning);

            // Auto-fill appraisal value if empty
            if (!formData.appraisalValue) {
                setFormData(prev => ({ ...prev, appraisalValue: result.valuation.toString() }));
            }

            toast.success("Document Verified & Valuated!", { id: toastId });
        } else {
            setIsVerified(false);
            setAiValuation(null);
            setAiReasoning(result.reasoning);
            toast.error(`Verification Failed: ${result.reasoning}`, { id: toastId });
        }
    } catch (error) {
        console.error("AI Analysis Error:", error);
        toast.error("AI Analysis failed. Please try again.", { id: toastId });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleTokenize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return toast.error("Please connect wallet");
    if (!isVerified) return toast.error("Please verify property document with AI first.");

    setIsProcessing(true);
    const toastId = toast.loading("Generating Legal Contract...");

    try {
      // 1. Generate Legal Contract PDF & Hash
      const { hash } = await generateLegalContract(
        account,
        formData.appraisalValue,
        formData.requestedLiquidity,
        Number(formData.duration),
        formData.propertyAddress
      );

      toast.loading("Minting IP Asset...", { id: toastId });

      // 2. Interact with Smart Contract
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, EquiFlowABI, signer);

      // Convert duration to seconds based on unit
      let durationInSeconds = Number(formData.duration);
      if (durationUnit === "months") durationInSeconds *= 30 * 24 * 60 * 60;
      else if (durationUnit === "years") durationInSeconds *= 365 * 24 * 60 * 60;
      else durationInSeconds *= 24 * 60 * 60; // days

      // Ensure all numeric values are passed as strings for uint256
      const appraisalValueWei = ethers.parseEther(formData.appraisalValue.toString());
      const requestedLiquidityWei = ethers.parseEther(formData.requestedLiquidity.toString());
      const durationWei = durationInSeconds.toString();
      const aiValuationWei = aiValuation ? ethers.parseEther(aiValuation.toString()) : "0";

      console.log("Tokenizing with args:", {
        tokenURI: "ipfs://placeholder-cid",
        appraisalValue: appraisalValueWei,
        requestedLiquidity: requestedLiquidityWei,
        duration: durationWei,
        documentHash: hash,
        aiValuation: aiValuationWei,
        propertyAddress: formData.propertyAddress
      });

      const tx = await contract.tokenizeHome(
        "ipfs://placeholder-cid",
        appraisalValueWei,
        requestedLiquidityWei,
        durationWei,
        hash,
        aiValuationWei,
        formData.propertyAddress
      );

      await tx.wait();

      toast.success(
        <div className="flex flex-col gap-1">
          <span>Property Tokenized Successfully!</span>
          <a
            href={`https://aeneid.storyscan.io/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-300 hover:text-purple-200 underline flex items-center gap-1"
          >
            View on Explorer <ArrowRight className="w-3 h-3" />
          </a>
        </div>,
        { id: toastId, duration: 5000 }
      );
      if (onSuccess) onSuccess();

      // Reset form
      setFormData({
        propertyAddress: "",
        appraisalValue: "",
        requestedLiquidity: "",
        duration: "",
        deedFile: null
      });
      setIsVerified(false);
      setAiValuation(null);
      setAiReasoning(null);

    } catch (error: any) {
      console.error("Tokenization Error:", error);
      toast.error(error.reason || error.message || "Tokenization failed", { id: toastId });
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
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-15">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Home className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Tokenize Property</h3>
            <p className="text-sm text-gray-400">Create IP Asset</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors -mr-2 -mt-2"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        )}
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
                Verify with AI
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

