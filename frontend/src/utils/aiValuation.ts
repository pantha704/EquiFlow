import { ethers } from 'ethers';

export const estimatePropertyValuation = async (address: string): Promise<number> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Deterministic "random" value based on address hash
  // This ensures the same address always gets the same valuation
  const hash = ethers.keccak256(ethers.toUtf8Bytes(address));
  const hashInt = BigInt(hash);

  // Generate a value between 100,000 and 2,000,000
  const minVal = 100000;
  const maxVal = 2000000;
  const range = BigInt(maxVal - minVal);

  const valuation = Number((hashInt % range) + BigInt(minVal));

  // Round to nearest 1000 for cleaner numbers
  return Math.round(valuation / 1000) * 1000;
};

export const analyzePropertyDocument = async (file: File): Promise<{ verified: boolean; valuation: number; reasoning: string }> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Mock logic: If file exists, verify it.
  if (file && file.size > 0) {
      // Generate a random valuation between 500k and 1.5M
      const valuation = Math.floor(Math.random() * (1500000 - 500000 + 1)) + 500000;
      return {
          verified: true,
          valuation: Math.round(valuation / 1000) * 1000,
          reasoning: "The document appears to be a valid property deed. Property details match public records."
      };
  }

  return {
      verified: false,
      valuation: 0,
      reasoning: "Could not verify the document. Please ensure it is a clear image or PDF of a valid deed."
  };
};
