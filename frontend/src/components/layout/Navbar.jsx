import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bike, 
  Search, 
  PlusCircle, 
  LayoutDashboard, 
  Bell, 
  Menu, 
  X, 
  User, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: Bike },
    { name: 'Find Ride', path: '/find', icon: Search },
    { name: 'Offer Ride', path: '/offer', icon: PlusCircle },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#080d19]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
                <Bike className="w-6 h-6 text-white transform group-hover:-rotate-6 transition duration-200" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Ride<span className="text-cyan-400">Share</span>
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Smart Two-Wheeler
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                      active
                        ? 'bg-slate-800/90 text-cyan-400 border border-slate-700/80 shadow-inner'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/offer">
              <Button size="sm" variant="primary" icon={PlusCircle}>
                Offer a Ride
              </Button>
            </Link>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400"></span>
            </button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  RK
                </div>
                <div className="hidden lg:block">
                  <div className="text-xs font-semibold text-slate-200">Rohit Kumar</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> Verified Rider
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {profileOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0c1424] border border-slate-800 p-2 shadow-2xl z-50 text-xs"
                  onClick={() => setProfileOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 text-slate-400">
                    Signed in as <span className="font-semibold text-white block">rohit@example.com</span>
                  </div>
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg">
                    <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" /> Dashboard
                  </Link>
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> Profile & Bike Details
                  </Link>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-lg">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#090e1b] px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  active
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link to="/offer" onClick={() => setMobileMenuOpen(false)}>
              <Button size="md" variant="primary" className="w-full" icon={PlusCircle}>
                Offer a Ride
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
