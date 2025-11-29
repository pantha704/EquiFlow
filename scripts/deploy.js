const hre = require("hardhat");

async function main() {
  // Deploy Mocks
  const MockIPRegistry = await hre.ethers.getContractFactory(
    "MockIPAssetRegistry"
  );
  const mockIPRegistry = await MockIPRegistry.deploy();
  await mockIPRegistry.waitForDeployment();
  const IP_REGISTRY_ADDR = await mockIPRegistry.getAddress();
  console.log("Mock IP Registry deployed to:", IP_REGISTRY_ADDR);

  const MockLicensingModule = await hre.ethers.getContractFactory(
    "MockLicensingModule"
  );
  const mockLicensingModule = await MockLicensingModule.deploy();
  await mockLicensingModule.waitForDeployment();
  const LICENSING_MODULE_ADDR = await mockLicensingModule.getAddress();
  console.log("Mock Licensing Module deployed to:", LICENSING_MODULE_ADDR);

  const MockPILTemplate = await hre.ethers.getContractFactory(
    "MockPILTemplate"
  );
  const mockPILTemplate = await MockPILTemplate.deploy();
  await mockPILTemplate.waitForDeployment();
  const PIL_TEMPLATE_ADDR = await mockPILTemplate.getAddress();
  console.log("Mock PIL Template deployed to:", PIL_TEMPLATE_ADDR);

  console.log(
    "Deploying EquiFlow with args:",
    IP_REGISTRY_ADDR,
    LICENSING_MODULE_ADDR,
    PIL_TEMPLATE_ADDR
  );

  const EquiFlow = await hre.ethers.getContractFactory("EquiFlow");
  const equiflow = await EquiFlow.deploy(
    IP_REGISTRY_ADDR,
    LICENSING_MODULE_ADDR,
    PIL_TEMPLATE_ADDR
  );

  await equiflow.waitForDeployment();
  const equiflowAddress = await equiflow.getAddress();

  console.log("EquiFlow deployed to:", equiflowAddress);

  // AUTOMATION: Update Frontend Constants
  const fs = require("fs");
  const path = require("path");

  const constantsDir = path.join(__dirname, "../frontend/src/constants");
  if (!fs.existsSync(constantsDir)) {
    fs.mkdirSync(constantsDir, { recursive: true });
  }

  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/EquiFlow.sol/EquiFlow.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const constantsContent = `export const CONTRACT_ADDRESS = "${equiflowAddress}";

export const EquiFlowABI = ${JSON.stringify(artifact.abi, null, 2)};

export const ADMIN_ADDRESSES = [
  "0xEC2A43214A1fB59a2851cfcE088CDC1F4e4C70Cd", // Primary Admin
  "0xec2a43214a1fb59a2851cfce088cdc1f4e4c70cd"  // Lowercase variant just in case
];
`;

  fs.writeFileSync(path.join(constantsDir, "index.ts"), constantsContent);
  console.log("Frontend constants updated in src/constants/index.ts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
