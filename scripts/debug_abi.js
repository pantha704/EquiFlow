const { ethers } = require("ethers");

const ABI = [
  {
    inputs: [
      { internalType: "string", name: "tokenURI", type: "string" },
      { internalType: "uint256", name: "appraisalValue", type: "uint256" },
      { internalType: "uint256", name: "requestedLiquidity", type: "uint256" },
      { internalType: "uint256", name: "duration", type: "uint256" },
      { internalType: "string", name: "documentHash", type: "string" },
      { internalType: "uint256", name: "aiValuation", type: "uint256" },
      { internalType: "string", name: "propertyAddress", type: "string" },
    ],
    name: "tokenizeHome",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function main() {
  const iface = new ethers.Interface(ABI);

  const args = [
    "ipfs://mock-metadata",
    500000000000000000000000n,
    10000000000000000000000n,
    1036800n,
    "0x5524ab05240f22d62e93767c5a30acbb60366b56d7463c87fc3a5f1cdd72d01c",
    0n, // aiValuation
    "Ch-6 Jyangra, Ghosh Paraaaaa",
  ];

  console.log("Attempting to encode with args:", args);

  try {
    const data = iface.encodeFunctionData("tokenizeHome", args);
    console.log("Success! Encoded data:", data);
  } catch (error) {
    console.error("Error encoding data:", error);
  }
}

main();
