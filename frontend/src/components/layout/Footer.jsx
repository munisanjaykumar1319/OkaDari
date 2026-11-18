import React from 'react';
import { Bike, Shield, Heart, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#14213D] border-t border-blue-900/40 text-slate-300 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-md">
                <Bike className="w-5 h-5" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                Oka<span className="text-blue-400">Dari</span>
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              One Route. One Ride. Shared Journey.
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Smart bike ride-sharing and fair cost-sharing platform. Cut commute costs, reduce traffic congestion, and travel safer together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-cyan-400 transition">Home</Link></li>
              <li><Link to="/find" className="hover:text-cyan-400 transition">Find a Ride</Link></li>
              <li><Link to="/offer" className="hover:text-cyan-400 transition">Offer a Ride</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyan-400 transition">Rider Dashboard</Link></li>
            </ul>
          </div>

          {/* Safety & Cost */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Features</h4>
            <ul className="space-y-2">
              <li className="hover:text-cyan-400 transition cursor-pointer">Smart Route Similarity</li>
              <li className="hover:text-cyan-400 transition cursor-pointer">Fair Fuel & Cost Split</li>
              <li className="hover:text-cyan-400 transition cursor-pointer">Verified Vehicle & DL</li>
              <li className="hover:text-cyan-400 transition cursor-pointer">Emergency SOS Protocol</li>
            </ul>
          </div>

          {/* Platform Status */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">System Architecture</h4>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Architecture:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  FastAPI + React
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">UI Design:</span>
                <span className="text-cyan-400 font-mono">Dark Navy System</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Status:</span>
                <span className="text-indigo-400 font-mono">Phase 2 Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500">
            © 2026 Smart Bike Ride-Sharing & Cost-Sharing System. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1 hover:text-slate-300 transition">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> Safe & Verified Community
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
