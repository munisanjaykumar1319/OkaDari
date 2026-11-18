import React from 'react';
import { Bike, Shield, Heart, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 text-gray-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-md">
                <Bike className="w-5 h-5" />
              </div>
              <span className="font-bold text-base text-gray-900 tracking-tight">
                Oka<span className="text-[#2563EB]">Dari</span>
              </span>
            </div>
            <p className="text-gray-700 text-xs font-semibold">
              One Route. One Ride. Shared Journey.
            </p>
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Smart bike ride-sharing and fair cost-sharing platform. Cut commute costs, reduce traffic congestion, and travel safer together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-blue-600 transition">Home</Link></li>
              <li><Link to="/find" className="hover:text-blue-600 transition">Find a Ride</Link></li>
              <li><Link to="/offer" className="hover:text-blue-600 transition">Offer a Ride</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-600 transition">Rider Dashboard</Link></li>
            </ul>
          </div>

          {/* Safety & Cost */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Features</h4>
            <ul className="space-y-2">
              <li className="hover:text-blue-600 transition cursor-pointer">Smart Route Similarity</li>
              <li className="hover:text-blue-600 transition cursor-pointer">Fair Fuel & Cost Split</li>
              <li className="hover:text-blue-600 transition cursor-pointer">Verified Vehicle & DL</li>
              <li className="hover:text-blue-600 transition cursor-pointer">Emergency SOS Protocol</li>
            </ul>
          </div>

          {/* Platform Status */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">System Architecture</h4>
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Architecture:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> FastAPI + React
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">UI Design:</span>
                <span className="text-blue-600 font-medium">OkaDari Clean</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Status:</span>
                <span className="text-gray-700 font-semibold">Active & Live</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} OkaDari Ride Sharing. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <span className="hover:text-gray-600 transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-600 transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-600 transition cursor-pointer">Community Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
