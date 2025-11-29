"use client";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <div className="relative pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight"
        >
          Turn your home into a <br />
          <span className="text-gradient">Surreal Asset</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto"
        >
          Unlock instant liquidity by tokenizing your property on Story Protocol.
          Sell fractional ownership and access the future of Real World Assets.
        </motion.p>
      </div>
    </div>
  );
}
