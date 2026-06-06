"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer>
      {/* Final CTA */}
      <div className="bg-brand-900 dark:bg-[#070b14] border-t border-brand-800 dark:border-brand-900 py-16 md:py-20 text-center px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Ready to Start Your JEE Practice?
          </h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Begin with a free full-length mock test. No credit card required.
            Upgrade when you are ready for deeper analytics and unlimited practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/register">
              <Button className="bg-brand-600 hover:bg-brand-500 text-white font-semibold h-11 px-8 shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-[180ms] ease-in-out active:translate-y-0 motion-reduce:transition-none motion-reduce:transform-none text-sm">
                Try Free Mock Test
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                className="border-brand-700 text-gray-300 hover:bg-brand-800 hover:text-white font-medium h-11 px-8 transition-all duration-[180ms] ease-in-out motion-reduce:transition-none text-sm"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-brand-950 dark:bg-black border-t border-brand-900/50">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-brand-800 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">
                JEE<span className="text-brand-400 font-medium">mocks</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
              NTA-accurate mock tests and analytics for JEE Main & Advanced aspirants.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">
              Platform
            </span>
            <ul className="space-y-2">
              <li><Link href="#simulator" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Exam Simulator</Link></li>
              <li><Link href="#features" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Features</Link></li>
              <li><Link href="#analytics" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Analytics</Link></li>
            </ul>
          </div>

          {/* Plans */}
          <div className="space-y-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">
              Plans
            </span>
            <ul className="space-y-2">
              <li><Link href="#pricing" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Pricing</Link></li>
              <li><span className="text-xs text-gray-600 block">Pro: Rs. 999/year</span></li>
              <li><span className="text-xs text-gray-600 block">Elite: Rs. 1,799/year</span></li>
            </ul>
          </div>

          {/* Disclaimers */}
          <div className="space-y-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">
              Legal
            </span>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
              Independent test-prep resource. NTA, JEE, and IIT-JEE are trademarks of their respective owners.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-brand-900/50 py-4 text-center">
          <p className="text-[10px] text-gray-600">
            &copy; {new Date().getFullYear()} JEEmocks. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
