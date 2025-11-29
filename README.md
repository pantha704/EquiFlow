# EquiFlow

**Agentic Home Equity DAO on Story Protocol**

EquiFlow allows homeowners to tokenize their property as an IP Asset on Story Protocol and sell fractional ownership (Shared Appreciation) to investors.

## Tech Stack

- **Smart Contracts**: Solidity, Hardhat, Story Protocol (Odyssey Testnet)
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Ethers.js

## Prerequisites

- Node.js / Bun
- Metamask Wallet
- Story Odyssey Testnet ETH (Faucet: https://faucet.story.foundation)

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   cd frontend && npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:

   ```
   PRIVATE_KEY=your_wallet_private_key
   STORY_RPC_URL=https://odyssey.storyrpc.io
   ```

3. **Deploy Contracts**

   ```bash
   npx hardhat run scripts/deploy.js --network storyOdyssey
   ```

   _Note: Copy the deployed contract address._

4. **Configure Frontend**
   Update `frontend/src/app/page.tsx` with your deployed contract address:

   ```javascript
   const CONTRACT_ADDRESS = "YOUR_DEPLOYED_ADDRESS";
   ```

5. **Run Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

## Remix Deployment

1. Open [Remix IDE](https://remix.ethereum.org).
2. Create `EquiFlow.sol` and paste the contract code.
3. Compile with Solidity `0.8.23`.
4. In "Deploy & Run", select "Injected Provider - MetaMask" (ensure you are on Story Odyssey Testnet).
5. Deploy with the following constructor arguments (Story Protocol Addresses):
   - IP Registry: `0x292639452A975630802C17c9267169D93BD5a793`
   - Licensing Module: `0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f02631`
   - License Template: `0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316`

## ABI / IDL

The ABI is available in `artifacts/contracts/EquiFlow.sol/EquiFlow.json` after compilation.
For the frontend, we use a simplified ABI:

```json
[
  "function tokenizeHome(string memory tokenURI, uint256 appraisalValue, uint256 requestedLiquidity) external returns (uint256)"
]
```
