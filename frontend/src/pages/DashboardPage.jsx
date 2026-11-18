import React, { useState, useEffect } from 'react';
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
  LogIn, 
  XCircle, 
  RefreshCw,
  UserCheck,
  UserX,
  MessageSquare
} from 'lucide-react';
import axios from 'axios';
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
  
  const [offeredRides, setOfferedRides] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Active user profile
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

  // Fetch real offered rides & bookings
  const loadDashboardData = async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    try {
      // 1. Fetch Offered Rides
      const offeredRes = await axios.get('/api/v1/rides/my-offered');
      const mappedOffered = offeredRes.data.map(r => {
        const d = new Date(r.departure_time);
        return {
          id: r.id,
          role: 'offered',
          status: r.status,
          from: r.origin,
          to: r.destination,
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          bikeModel: r.bike_model,
          partnerName: 'Pillion Available',
          distanceKm: r.distance_km,
          cost: r.cost_per_seat,
          canCancel: r.status === 'OPEN'
        };
      });
      setOfferedRides(mappedOffered);

      // 2. Fetch Passenger Bookings
      const bookingsRes = await axios.get('/api/v1/bookings/my-bookings');
      const mappedBookings = bookingsRes.data.map(b => {
        const r = b.ride || {};
        const d = r.departure_time ? new Date(r.departure_time) : new Date();
        return {
          id: b.id,
          bookingId: b.id,
          rideId: b.ride_id,
          role: 'booked',
          status: b.status,
          from: r.origin || b.pickup_point || 'Pickup Point',
          to: r.destination || 'Destination Point',
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          bikeModel: r.bike_model || 'Two Wheeler',
          partnerName: r.rider?.full_name ? `${r.rider.full_name} (Rider)` : 'Host Rider',
          distanceKm: r.distance_km || 10.0,
          cost: b.agreed_contribution,
          canCancel: b.status === 'PENDING' || b.status === 'ACCEPTED'
        };
      });
      setMyBookings(mappedBookings);

      // 3. For every open offered ride, check for pending requests
      const allRequests = [];
      for (const ride of offeredRes.data) {
        if (ride.status === 'OPEN' || ride.status === 'FULL') {
          try {
            const reqRes = await axios.get(`/api/v1/bookings/ride/${ride.id}/requests`);
            for (const item of reqRes.data) {
              if (item.status === 'PENDING') {
                allRequests.push({ ...item, rideOrigin: ride.origin, rideDest: ride.destination });
              }
            }
          } catch (e) {
            // Ignored
          }
        }
      }
      setPendingRequests(allRequests);
    } catch (err) {
      console.warn('Dashboard data fetch warning:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  // Booking Actions
  const handleAcceptRequest = async (bookingId) => {
    setActionLoading(true);
    try {
      await axios.patch(`/api/v1/bookings/${bookingId}/accept`);
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to accept booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (bookingId) => {
    setActionLoading(true);
    try {
      await axios.patch(`/api/v1/bookings/${bookingId}/reject`);
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setActionLoading(true);
    try {
      await axios.patch(`/api/v1/bookings/${bookingId}/cancel`);
      await loadDashboardData();
      setSelectedRide(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!confirm('Are you sure you want to cancel this ride offer?')) return;
    setActionLoading(true);
    try {
      await axios.patch(`/api/v1/rides/${rideId}/cancel`);
      await loadDashboardData();
      setSelectedRide(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel ride');
    } finally {
      setActionLoading(false);
    }
  };

  // Combine rides for display
  const allRides = [...offeredRides, ...myBookings];

  const displayedRides = 
    activeTab === 'overview' 
      ? allRides 
      : activeTab === 'offered' 
        ? offeredRides 
        : myBookings;

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

      {/* Incoming Booking Requests Alert (For Riders) */}
      {pendingRequests.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-600/50 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
              <Users className="w-4 h-4" />
              <span>You have {pendingRequests.length} incoming booking request(s)!</span>
            </div>
            <Badge variant="warning" size="sm" dot>Pending Approval</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-semibold text-white">Passenger Request #{req.id}</div>
                  <div className="text-[11px] text-slate-400">
                    Route: {req.rideOrigin} &rarr; {req.rideDest}
                  </div>
                  <div className="text-[11px] text-cyan-400 font-semibold mt-0.5">
                    Contribution: ₹{req.agreed_contribution}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button 
                    size="sm" 
                    variant="success" 
                    icon={UserCheck}
                    disabled={actionLoading}
                    onClick={() => handleAcceptRequest(req.id)}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    icon={UserX}
                    disabled={actionLoading}
                    onClick={() => handleRejectRequest(req.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Rides"
          value={allRides.length.toString()}
          subtext={`${offeredRides.length} Offered • ${myBookings.length} Booked`}
          icon={Bike}
          trend="+15% activity"
        />
        <StatCard
          title="Fuel Cost Saved"
          value="₹3,450"
          subtext="Fair transparent expense sharing"
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
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            All Activity ({allRides.length})
          </button>
          <button
            onClick={() => setActiveTab('offered')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'offered'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            My Offered Rides ({offeredRides.length})
          </button>
          <button
            onClick={() => setActiveTab('booked')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'booked'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            My Bookings ({myBookings.length})
          </button>
        </div>

        {isAuthenticated && (
          <button
            onClick={loadDashboardData}
            disabled={loadingData}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}
      </div>

      {/* Rides List Section */}
      <RecentRides 
        rides={displayedRides}
        onSelectRide={(ride) => setSelectedRide(ride)}
      />

      {/* Ride Details & Management Modal */}
      <Modal
        isOpen={!!selectedRide}
        onClose={() => setSelectedRide(null)}
        title={selectedRide?.role === 'booked' ? "Confirmed Booking Details" : "Ride Offer Summary & Management"}
      >
        {selectedRide && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
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
                <span className="text-slate-400">Status:</span>
                <Badge variant={selectedRide.status === 'ACCEPTED' || selectedRide.status === 'OPEN' || selectedRide.status === 'Confirmed' ? 'success' : 'warning'}>
                  {selectedRide.status}
                </Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Calculated Fuel Expense:</span>
                <span>₹{selectedRide.cost * 2}</span>
              </div>
              <div className="flex justify-between text-cyan-400 font-bold text-sm pt-1 border-t border-cyan-800/40">
                <span>Passenger Fair Contribution:</span>
                <span>₹{selectedRide.cost} (50%)</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {/* If booked and can cancel */}
              {selectedRide.role === 'booked' && selectedRide.canCancel && (
                <Button 
                  size="sm" 
                  variant="danger" 
                  icon={XCircle}
                  loading={actionLoading}
                  onClick={() => handleCancelBooking(selectedRide.bookingId || selectedRide.id)}
                >
                  Cancel Booking
                </Button>
              )}

              {/* If offered and can cancel */}
              {selectedRide.role === 'offered' && selectedRide.canCancel && (
                <Button 
                  size="sm" 
                  variant="danger" 
                  icon={XCircle}
                  loading={actionLoading}
                  onClick={() => handleCancelRide(selectedRide.id)}
                >
                  Cancel Ride Offer
                </Button>
              )}

              <Button size="sm" variant="secondary" onClick={() => setSelectedRide(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
