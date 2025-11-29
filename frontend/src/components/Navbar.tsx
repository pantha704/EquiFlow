import { useState } from 'react';
import Link from 'next/link';

import { ADMIN_ADDRESSES } from '@/constants';

interface NavbarProps {
  account: string | null;
  connectWallet: () => void;
  disconnectWallet?: () => void;
}

export default function Navbar({ account, connectWallet, disconnectWallet }: NavbarProps) {
  const [isHovering, setIsHovering] = useState(false);

  const isAdmin = account && ADMIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(account.toLowerCase());

  const handleClick = () => {
    if (account) {
      if (disconnectWallet) disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-600">
          EquiFlow
        </Link>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 ml-4 -translate-y-1/2 hidden md:flex items-center gap-8">
          <Link href="/market" className="text-sm text-gray-300 hover:text-white transition-colors">
            Market
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
            Dashboard
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm text-gray-300 hover:text-white transition-colors">
              Admin
            </Link>
          )}
        </div>

        <button
          onClick={handleClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`px-6 py-2.5 rounded-full border transition-all text-sm font-medium w-40 flex justify-center ${
            account
              ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
          }`}
        >
          {account ? (
            isHovering ? "Disconnect" : `${account.slice(0, 6)}...${account.slice(-4)}`
          ) : (
            "Connect Wallet"
          )}
        </button>
      </div>
    </nav>
  );
}
