"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../providers/AuthContext';
import { useTheme } from '../providers/ThemeContext';
import { Button } from '../ui/Button';
import { Menu, X, Sun, Moon, GraduationCap } from 'lucide-react';

const NAV_ITEMS = [
  { href: '#simulator', label: 'Exam Simulator' },
  { href: '#features', label: 'Why Us' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export default function Header() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-brand-800 dark:bg-brand-700 flex items-center justify-center text-white transition-colors group-hover:bg-brand-700">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-brand-900 dark:text-white">
            JEE<span className="text-brand-600 dark:text-brand-400 font-medium">mocks</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-brand-800 dark:hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>

          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" className="bg-brand-800 hover:bg-brand-700 text-white font-semibold px-4">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-800 font-medium px-3">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-brand-800 hover:bg-brand-700 text-white font-semibold px-5">
                  Try Free Mock
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-white dark:bg-[#0d1117] border-t border-gray-100 dark:border-gray-800 px-6 py-5 space-y-4">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className="py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand-800 dark:hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => { toggleTheme(); setIsMobileOpen(false); }}
              className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              <span>Theme</span>
              <span className="text-gray-400">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
            {isAuthenticated ? (
              <Link href="/dashboard" onClick={() => setIsMobileOpen(false)}>
                <Button className="w-full bg-brand-800 hover:bg-brand-700 text-white font-semibold">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                  <Button variant="outline" className="w-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileOpen(false)}>
                  <Button className="w-full bg-brand-800 hover:bg-brand-700 text-white font-semibold">
                    Try Free Mock
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
