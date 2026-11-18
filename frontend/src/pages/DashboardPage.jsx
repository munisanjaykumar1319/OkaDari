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
  MessageSquare,
  HeartPulse,
  ShieldAlert,
  Navigation,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import RecentRides from '../components/dashboard/RecentRides';
import Card, { CardHeader } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import SafetyHubModal from '../components/safety/SafetyHubModal';
import ReviewModal from '../components/safety/ReviewModal';
import ReportModal from '../components/safety/ReportModal';
import LiveLocationProvider from '../components/location/LiveLocationProvider';
import LiveLocationViewer from '../components/location/LiveLocationViewer';

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
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  // Live location tracking state
  const [liveViewerRide, setLiveViewerRide] = useState(null);

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
          rawRiderName: r.rider?.full_name || 'Host Rider',
          riderId: r.rider_id,
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
    <div className="min-h-screen bg-[#F8FAFC] text-gray-800 pb-16" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* If not authenticated banner */}
        {!isAuthenticated && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>Viewing in Demo Preview mode. Sign in to sync your active rides and personal vehicle documents.</span>
            </div>
            <Button size="sm" variant="primary" icon={LogIn} onClick={() => navigate('/login')}>
              Sign In Now
            </Button>
          </div>
        )}

        {/* Top Banner / Welcome Profile */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center text-xl font-black text-white shadow-md shadow-blue-500/20">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{user.name}</h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {user.bikeModel} • Plate: <span className="font-mono text-gray-700 font-semibold">{user.bikePlate}</span> • {user.email}
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

        {/* Safety, Verification & SOS Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Identity & Verification</div>
              <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Phone: {authUser?.is_verified ? 'Verified ✅' : 'Unverified ⚠️'}</span>
                <span>•</span>
                <span>DL: {authUser?.is_dl_verified ? 'Verified 🛡️' : 'Optional'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Trust & Rating Score</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {authUser?.rating_avg || 5.0} ⭐ ({authUser?.rating_count || 0} reviews)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Emergency Contact</div>
              <div className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[150px]">
                {authUser?.emergency_contact_name ? `${authUser.emergency_contact_name} (${authUser.emergency_contact_phone})` : 'Not configured'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-start md:justify-end">
            <button
              onClick={() => setSafetyModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Safety & SOS Hub</span>
            </button>
          </div>
        </div>

        {/* Incoming Booking Requests Alert (For Riders) */}
        {pendingRequests.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <Users className="w-4 h-4 text-amber-700" />
                <span>You have {pendingRequests.length} incoming booking request(s)!</span>
              </div>
              <Badge variant="warning" size="sm" dot>Pending Approval</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {pendingRequests.map(req => (
                <div key={req.id} className="p-3.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-4 text-xs shadow-sm">
                  <div>
                    <div className="font-semibold text-gray-900">Passenger Request #{req.id}</div>
                    <div className="text-[11px] text-gray-500">
                      Route: {req.rideOrigin} &rarr; {req.rideDest}
                    </div>
                    <div className="text-[11px] text-blue-600 font-bold mt-0.5">
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
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 border-emerald-100"
            trend="Saved 54%"
          />
          <StatCard
            title="Total Shared Distance"
            value="580 km"
            subtext="Reduced ~62 kg CO₂ emissions"
            icon={TrendingUp}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 border-blue-100"
          />
          <StatCard
            title="Trust & Safety Rating"
            value={`${user.rating} ★`}
            subtext={`Based on ${user.totalReviews} verified reviews`}
            icon={Star}
            iconColor="text-amber-500"
            iconBg="bg-amber-50 border-amber-100"
          />
        </div>

        {/* Tabs navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All Activity ({allRides.length})
            </button>
            <button
              onClick={() => setActiveTab('offered')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'offered'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              My Offered Rides ({offeredRides.length})
            </button>
            <button
              onClick={() => setActiveTab('booked')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'booked'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              My Bookings ({myBookings.length})
            </button>
          </div>

          {isAuthenticated && (
            <button
              onClick={loadDashboardData}
              disabled={loadingData}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              title="Refresh rides data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          )}
        </div>

        {/* Recent Rides Table / List */}
        <RecentRides
          title={
            activeTab === 'overview' 
              ? "All Active & Scheduled Rides" 
              : activeTab === 'offered' 
                ? "Rides You Are Offering" 
                : "Rides You Have Booked"
          }
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
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Route:</span>
                  <span className="font-semibold text-gray-900">{selectedRide.from} &rarr; {selectedRide.to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Schedule:</span>
                  <span className="text-blue-600 font-semibold">{selectedRide.date} at {selectedRide.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bike:</span>
                  <span className="text-gray-700 font-medium">{selectedRide.bikeModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge variant={selectedRide.status === 'ACCEPTED' || selectedRide.status === 'OPEN' || selectedRide.status === 'Confirmed' ? 'success' : 'warning'}>
                    {selectedRide.status}
                  </Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <div className="flex justify-between text-gray-700">
                  <span>Calculated Fuel Expense:</span>
                  <span>₹{selectedRide.cost * 2}</span>
                </div>
                <div className="flex justify-between text-blue-700 font-bold text-sm pt-1 border-t border-blue-200">
                  <span>Passenger Fair Contribution:</span>
                  <span>₹{selectedRide.cost} (50%)</span>
                </div>
              </div>

              {/* Safety, Review & Report Action for Passenger Bookings */}
              {selectedRide.role === 'booked' && (selectedRide.status === 'ACCEPTED' || selectedRide.status === 'COMPLETED') && (
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Star}
                    onClick={() => {
                      setReviewTarget({
                        rideId: selectedRide.rideId || selectedRide.id,
                        revieweeId: selectedRide.riderId,
                        revieweeName: selectedRide.rawRiderName || selectedRide.partnerName
                      });
                      setSelectedRide(null);
                    }}
                  >
                    Rate Experience
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={ShieldAlert}
                    onClick={() => {
                      setReportTarget({
                        userId: selectedRide.riderId,
                        userName: selectedRide.rawRiderName || selectedRide.partnerName,
                        rideId: selectedRide.rideId || selectedRide.id
                      });
                      setSelectedRide(null);
                    }}
                  >
                    Report / Block
                  </Button>
                </div>
              )}

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

                {/* Live Location Sharing — for offered rides */}
                {selectedRide.role === 'offered' && isAuthenticated && (
                  <div className="w-full mt-4">
                    <LiveLocationProvider
                      rideId={selectedRide.id}
                      token={localStorage.getItem('access_token')}
                    />
                  </div>
                )}

                {/* Live Location Viewer — for accepted bookings */}
                {selectedRide.role === 'booked' && selectedRide.status === 'ACCEPTED' && isAuthenticated && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Eye}
                    onClick={() => setLiveViewerRide({ rideId: selectedRide.rideId })}
                  >
                    Track Live Location
                  </Button>
                )}

                <Button size="sm" variant="secondary" onClick={() => setSelectedRide(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Safety Hub & Emergency SOS Modal */}
        <SafetyHubModal 
          isOpen={safetyModalOpen} 
          onClose={() => setSafetyModalOpen(false)} 
        />

        {/* Rating & Review Modal */}
        {reviewTarget && (
          <ReviewModal
            isOpen={!!reviewTarget}
            onClose={() => setReviewTarget(null)}
            rideId={reviewTarget.rideId}
            revieweeId={reviewTarget.revieweeId}
            revieweeName={reviewTarget.revieweeName}
            onSuccess={() => loadDashboardData()}
          />
        )}

        {/* Report & Block Modal */}
        {reportTarget && (
          <ReportModal
            isOpen={!!reportTarget}
            onClose={() => setReportTarget(null)}
            reportedUserId={reportTarget.userId}
            reportedUserName={reportTarget.userName}
            rideId={reportTarget.rideId}
            onSuccess={() => loadDashboardData()}
          />
        )}

        {/* Live Location Viewer Modal */}
        {liveViewerRide && (
          <LiveLocationViewer
            rideId={liveViewerRide.rideId}
            token={localStorage.getItem('access_token')}
            onClose={() => setLiveViewerRide(null)}
          />
        )}
      </div>
    </div>
  );
}
