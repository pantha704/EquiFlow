const hre = require("hardhat");
const { encryptDataField } = require("@story-protocol/core-sdk");

async function main() {
  const NEW_ADMIN = "0xEC2A43214A1fB59a2851cfcE088CDC1F4e4C70Cd";

  // Get the contract address from your constants or .env, but for now I'll assume it's the one recently deployed.
  // Since I don't have the exact address in a file I can read easily without parsing, I'll ask the user or check the frontend constants.
  // Actually, I can read it from frontend/src/constants/index.ts

  // Let's try to read the address from the frontend constants first to be safe.
  const fs = require("fs");
  const path = require("path");
  const constantsPath = path.join(
    __dirname,
    "../frontend/src/constants/index.ts"
  );
  const constantsContent = fs.readFileSync(constantsPath, "utf8");
  const match = constantsContent.match(
    /export const CONTRACT_ADDRESS = "([^"]+)"/
  );

  if (!match) {
    console.error(
      "Could not find CONTRACT_ADDRESS in frontend/src/constants/index.ts"
    );
    process.exit(1);
  }

  const CONTRACT_ADDRESS = match[1];
  console.log(`Found Contract Address: ${CONTRACT_ADDRESS}`);

  const EquiFlow = await hre.ethers.getContractFactory("EquiFlow");
  const contract = EquiFlow.attach(CONTRACT_ADDRESS);

  console.log(`Transferring ownership to ${NEW_ADMIN}...`);
  const tx = await contract.transferOwnership(NEW_ADMIN);
  await tx.wait();

  console.log("Ownership transferred successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
