import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronDown,
  LogIn,
  LogOut,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Badge from '../common/Badge';
import SafetyHubModal from '../safety/SafetyHubModal';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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

  const handleSignOut = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 text-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
                <Bike className="w-6 h-6 text-white transform group-hover:-rotate-6 transition duration-200" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-gray-900">
                  Oka<span className="text-[#2563EB]">Dari</span>
                </span>
                <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                  One Route. One Ride.
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
                        ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200/60 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Safety Hub & SOS Button */}
            <button
              onClick={() => setSafetyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition text-xs font-semibold shadow-sm cursor-pointer"
              title="Open Safety & Verification Center"
            >
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Safety & SOS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            </button>

            <Link to="/offer">
              <Button size="sm" variant="primary" icon={PlusCircle}>
                Offer a Ride
              </Button>
            </Link>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
            </button>

            {/* User Profile or Sign In */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs font-semibold text-gray-800">{user.full_name}</div>
                    <div className="text-[10px] text-blue-600 flex items-center gap-1 capitalize">
                      <ShieldCheck className="w-2.5 h-2.5" /> {user.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
                </button>

                {profileOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-gray-200 p-2 shadow-xl z-50 text-xs"
                    onClick={() => setProfileOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-gray-100 text-gray-500">
                      Signed in as <span className="font-semibold text-gray-900 block truncate">{user.email}</span>
                      {user.bike_model && (
                        <span className="text-[10px] text-gray-500 block mt-0.5">🏍️ {user.bike_model}</span>
                      )}
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg">
                      <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" /> Dashboard
                    </Link>
                    <button 
                      onClick={() => setSafetyModalOpen(true)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> Safety Center & SOS
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button size="sm" variant="outline" icon={LogIn}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="secondary">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
                isActive(link.path)
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => { setSafetyModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-200 mb-2"
            >
              <ShieldCheck className="w-4 h-4" /> Safety Center & SOS
            </button>
            <Link
              to="/offer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full block"
            >
              <Button size="md" variant="primary" icon={PlusCircle} className="w-full">
                Offer a Ride
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Global Safety & Emergency SOS Modal */}
      <SafetyHubModal 
        isOpen={safetyModalOpen} 
        onClose={() => setSafetyModalOpen(false)} 
      />
    </nav>
  );
}
