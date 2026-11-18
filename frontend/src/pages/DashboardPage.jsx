import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  PlusCircle, 
  TrendingUp, 
  ShieldCheck, 
  Star, 
  Search,
  CheckCircle2,
  AlertCircle,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import RecentRides from '../components/dashboard/RecentRides';
import Card, { CardHeader } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRide, setSelectedRide] = useState(null);

  // Active user data (from AuthContext or fallback demo)
  const user = authUser ? {
    name: authUser.full_name,
    email: authUser.email,
    role: authUser.role === 'both' ? 'Rider & Passenger' : authUser.role === 'rider' ? 'Verified Rider' : 'Passenger',
    phone: authUser.phone || '+91 98765 43210',
    verified: authUser.is_verified,
    rating: authUser.rating_avg || 5.0,
    totalReviews: authUser.rating_count || 0,
    bikeModel: authUser.bike_model || (authUser.role !== 'passenger' ? 'Vehicle Registered' : 'Commuter'),
    bikePlate: authUser.bike_plate || 'Not registered'
  } : {
    name: 'Rohit Kumar (Demo Mode)',
    email: 'rohit@example.com',
    role: 'Rider & Passenger',
    phone: '+91 98765 43210',
    verified: true,
    rating: 4.9,
    totalReviews: 28,
    bikeModel: 'Royal Enfield Hunter 350',
    bikePlate: 'TS 09 EZ 4589'
  };

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const rides = [
    {
      id: 101,
      role: 'offered',
      status: 'Confirmed',
      from: 'Kondapur Signal',
      to: 'Financial District, Nanakramguda',
      date: 'Today, Nov 18',
      time: '09:15 AM',
      bikeModel: user.bikeModel,
      partnerName: 'Priya Verma (Passenger)',
      distanceKm: 14.2,
      cost: 55
    },
    {
      id: 102,
      role: 'booked',
      status: 'Confirmed',
      from: 'Jubilee Hills Check Post',
      to: 'Madhapur Metro Station',
      date: 'Tomorrow, Nov 19',
      time: '06:30 PM',
      bikeModel: 'Honda CB350',
      partnerName: 'Karthik Rao (Rider)',
      distanceKm: 8.5,
      cost: 35
    },
    {
      id: 103,
      role: 'offered',
      status: 'Pending',
      from: 'Gachibowli Stadium',
      to: 'Raidurg Metro',
      date: 'Tomorrow, Nov 19',
      time: '08:45 AM',
      bikeModel: user.bikeModel,
      partnerName: 'Waiting for Request',
      distanceKm: 6.0,
      cost: 30
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* If not authenticated banner */}
      {!isAuthenticated && (
        <div className="p-4 rounded-xl bg-cyan-950/50 border border-cyan-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Viewing in Demo Preview mode. Sign in to sync your active rides and personal vehicle documents.</span>
          </div>
          <Button size="sm" variant="primary" icon={LogIn} onClick={() => navigate('/login')}>
            Sign In Now
          </Button>
        </div>
      )}

      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0d162b] to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-cyan-500/20">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">{user.name}</h1>
              <Badge variant="success" size="sm" dot>{user.role}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {user.bikeModel} • Plate: <span className="font-mono text-slate-300">{user.bikePlate}</span> • {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            icon={Search} 
            onClick={() => navigate('/find')}
          >
            Find a Ride
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={PlusCircle} 
            onClick={() => navigate('/offer')}
          >
            Offer New Ride
          </Button>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Rides Shared"
          value="42"
          subtext="28 as Rider • 14 as Passenger"
          icon={Bike}
          trend="+12% this mo"
        />
        <StatCard
          title="Fuel Cost Saved"
          value="₹3,450"
          subtext="Calculated via fair cost sharing"
          icon={DollarSign}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          trend="Saved 54%"
        />
        <StatCard
          title="Total Shared Distance"
          value="580 km"
          subtext="Reduced ~62 kg CO₂ emissions"
          icon={TrendingUp}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10 border-purple-500/20"
        />
        <StatCard
          title="Trust & Safety Rating"
          value={`${user.rating} ★`}
          subtext={`Based on ${user.totalReviews} verified reviews`}
          icon={Star}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border-amber-500/20"
        />
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          All Activity
        </button>
        <button
          onClick={() => setActiveTab('offered')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'offered'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          My Offered Rides ({rides.filter(r => r.role === 'offered').length})
        </button>
        <button
          onClick={() => setActiveTab('booked')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'booked'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          My Bookings ({rides.filter(r => r.role === 'booked').length})
        </button>
      </div>

      {/* Rides List Section */}
      <RecentRides 
        rides={activeTab === 'overview' ? rides : rides.filter(r => r.role === activeTab)}
        onSelectRide={(ride) => setSelectedRide(ride)}
      />

      {/* Ride Details Modal */}
      <Modal
        isOpen={!!selectedRide}
        onClose={() => setSelectedRide(null)}
        title="Ride Summary & Cost Breakdown"
      >
        {selectedRide && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Route:</span>
                <span className="font-semibold text-white">{selectedRide.from} &rarr; {selectedRide.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Schedule:</span>
                <span className="text-cyan-400">{selectedRide.date} at {selectedRide.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bike:</span>
                <span className="text-slate-200">{selectedRide.bikeModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distance:</span>
                <span className="text-slate-200">{selectedRide.distanceKm} km</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Calculated Fuel Expense:</span>
                <span>₹{selectedRide.cost * 2}</span>
              </div>
              <div className="flex justify-between text-cyan-400 font-bold text-sm pt-1 border-t border-cyan-800/40">
                <span>Your Fair Contribution:</span>
                <span>₹{selectedRide.cost} (50%)</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedRide(null)}>
                Close
              </Button>
              <Button size="sm" variant="primary" onClick={() => setSelectedRide(null)}>
                Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
