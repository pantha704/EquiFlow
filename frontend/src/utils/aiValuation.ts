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
