"use client";
// Force rebuild
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animation
      gsap.from(".hero-text", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out"
      });

      // Features Animation
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="hero-text text-6xl md:text-8xl font-bold mb-8 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Liquidity
            </span>
            <br />
            Without Selling.
          </h1>
          <p className="hero-text text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12">
            Tokenize your home equity as a programmable IP Asset on Story Protocol.
            Access global liquidity instantly while retaining ownership.
          </p>
          <div className="hero-text flex justify-center gap-6">
            <Link href="/dashboard" className="btn-primary flex items-center gap-2">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/market" className="px-8 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-bold">
              View Market
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-32 bg-black/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="feature-card glass-panel p-8 rounded-3xl border border-white/10">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">IP-Based Ownership</h3>
              <p className="text-gray-400">
                Your home deed is registered as an IP Asset on Story Protocol, ensuring legally binding, programmable ownership rights.
              </p>
            </div>

            <div className="feature-card glass-panel p-8 rounded-3xl border border-white/10">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Instant Liquidity</h3>
              <p className="text-gray-400">
                Unlock the value of your property in seconds. Connect with a global pool of investors ready to fund your loan.
              </p>
            </div>

            <div className="feature-card glass-panel p-8 rounded-3xl border border-white/10">
              <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Global Access</h3>
              <p className="text-gray-400">
                Democratizing real estate investment. Anyone, anywhere can invest in fractionalized home equity with minimal fees.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
