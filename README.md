# EquiFlow 🏠⚡

**Unlock Your Home's Equity on the Blockchain**

> **Winner of HackQuest 2024 (Simulated)** | **Built on Story Protocol**

EquiFlow is a decentralized platform that transforms real estate into liquid IP assets. By leveraging **Story Protocol**, we allow homeowners to tokenize their property equity, generate legally binding agreements, and access instant liquidity from a global pool of investors—without the banks, paperwork, or delays.

![EquiFlow Dashboard](./frontend/public/window.svg)

---

## 🚀 How It Works

EquiFlow bridges the gap between Real World Assets (RWA) and DeFi through a seamless 4-step workflow:

### 1. **Tokenize & Verify**

The homeowner lists their property on EquiFlow.

- **AI Valuation**: Our integrated AI agent instantly appraises the property value based on location and market data.
- **IP Registration**: The property is registered as a unique **IP Asset** on Story Protocol, creating an immutable on-chain record of ownership.

### 2. **Legal Compliance**

- **Auto-Generated Contracts**: A legally binding PDF agreement is cryptographically generated, embedding the specific loan terms (Duration, LTV, Interest).
- **On-Chain Hash**: The document's hash is stored on-chain, ensuring the terms cannot be altered.

### 3. **Instant Funding**

- **Global Liquidity**: Investors browse verified opportunities on the **Marketplace**.
- **One-Click Funding**: Investors fund the loan in stablecoins or ETH.
- **Smart Escrow**: Funds are released to the homeowner immediately upon successful funding.

### 4. **Repayment & Yield**

- **Automated Repayment**: Homeowners repay the loan + interest directly through the dashboard.
- **Investor Yield**: Investors receive their principal + interest, secured by the underlying real estate IP asset.
- **Foreclosure Protection**: If a deadline is missed, the smart contract allows for asset foreclosure (transfer of IP rights) to the investor.

---

## ✨ Key Features

| Feature                     | Description                                                                                  |
| :-------------------------- | :------------------------------------------------------------------------------------------- |
| **🤖 AI-Powered Appraisal** | Instant, data-driven property valuation to prevent fraud and ensure fair pricing.            |
| **📜 Programmable IP**      | Built on **Story Protocol**, turning static real estate into programmable, liquid IP assets. |
| **⚖️ Legal Engineering**    | Dynamic generation of legal PDFs that are hashed and linked to the smart contract.           |
| **💸 Instant Liquidity**    | Access equity in minutes, not months. No bank approvals required.                            |
| **🛡️ Trustless Security**   | Non-custodial smart contracts handle all funds, collateral, and transfers.                   |

---

## 🛠️ Technical Architecture

EquiFlow is built with a modern, robust web3 stack:

- **Blockchain**: Story Protocol (Odyssey Testnet)
- **Smart Contracts**: Solidity, Hardhat
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **IP Management**: Story Protocol SDK (IP Asset Registry, Licensing Module)
- **Design**: Glassmorphism UI with Framer Motion animations

---

## 🏁 Getting Started

Follow these steps to run EquiFlow locally.

### Prerequisites

- Node.js (v18+) or Bun
- MetaMask Wallet
- Story Odyssey Testnet ETH ([Faucet](https://faucet.story.foundation))

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/pantha704/EquiFlow.git
   cd EquiFlow
   ```

2. **Install Dependencies**

   ```bash
   # Root (Hardhat)
   npm install

   # Frontend
   cd frontend
   bun install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   PRIVATE_KEY=your_wallet_private_key
   STORY_RPC_URL=https://odyssey.storyrpc.io
   ```

4. **Deploy Smart Contracts**

   ```bash
   # From root directory
   npx hardhat run scripts/deploy.js --network storyOdyssey
   ```

   _The deployment script will automatically update the frontend constants._

5. **Run the Application**

   ```bash
   cd frontend
   bun run dev
   ```

6. **Open in Browser**
   Visit `http://localhost:3000` to start using EquiFlow.

---

## 🔮 Future Roadmap

- [ ] **Multi-Chain Support**: Expand to Base and Sepolia.
- [ ] **Fractionalization**: Allow multiple investors to fund a single property.
- [ ] **Legal Oracle**: Integration with Kleros for dispute resolution.
- [ ] **Fiat On-Ramp**: Direct fiat deposits for non-crypto natives.
