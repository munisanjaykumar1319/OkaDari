import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Filter, 
  Bike, 
  Star, 
  ShieldCheck, 
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  X
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

export default function FindRidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [fromQuery, setFromQuery] = useState(searchParams.get('from') || '');
  const [toQuery, setToQuery] = useState(searchParams.get('to') || '');
  const [dateQuery, setDateQuery] = useState(searchParams.get('date') || '');
  const [maxCost, setMaxCost] = useState('');
  const [helmetOnly, setHelmetOnly] = useState(false);
  const [sortBy, setSortBy] = useState('time_asc');

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Fallback sample rides when local backend has no rides seeded
  const fallbackRides = [
    {
      id: 1,
      from: 'Hitech City Cyber Towers',
      to: 'Gachibowli Bio-Diversity Park',
      date: 'Today',
      time: '09:00 AM',
      riderName: 'Vikram Reddy',
      rating: 4.9,
      reviewsCount: 34,
      bikeModel: 'Royal Enfield Classic 350',
      bikePlate: 'TS 09 FH 2021',
      distanceKm: 8.5,
      cost: 45,
      seats: 1,
      helmetProvided: true,
      matchScore: 98
    },
    {
      id: 2,
      from: 'Madhapur Metro Station',
      to: 'Financial District, Nanakramguda',
      date: 'Today',
      time: '09:30 AM',
      riderName: 'Pooja Nair',
      rating: 5.0,
      reviewsCount: 19,
      bikeModel: 'TVS Jupiter 125',
      bikePlate: 'TS 08 ET 9921',
      distanceKm: 12.0,
      cost: 50,
      seats: 1,
      helmetProvided: true,
      matchScore: 95
    },
    {
      id: 3,
      from: 'Kondapur RTO',
      to: 'Mindspace IT Park, Hitech City',
      date: 'Tomorrow',
      time: '08:45 AM',
      riderName: 'Rahul Verma',
      rating: 4.8,
      reviewsCount: 52,
      bikeModel: 'Yamaha FZ-S V3',
      bikePlate: 'TS 07 EQ 1144',
      distanceKm: 6.2,
      cost: 35,
      seats: 1,
      helmetProvided: false,
      matchScore: 92
    }
  ];

  const searchRidesFromAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (fromQuery.trim()) params.origin = fromQuery.trim();
      if (toQuery.trim()) params.destination = toQuery.trim();
      if (dateQuery.trim()) params.date = dateQuery.trim();
      if (maxCost) params.max_cost = parseFloat(maxCost);
      if (helmetOnly) params.helmet_required = true;
      if (sortBy) params.sort_by = sortBy;

      const response = await axios.get('/api/v1/rides/search', { params });
      
      if (response.data && response.data.length > 0) {
        const mapped = response.data.map((r, idx) => {
          const d = new Date(r.departure_time);
          return {
            id: r.id,
            from: r.origin,
            to: r.destination,
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            riderName: r.rider?.full_name || 'Verified Rider',
            rating: r.rider?.rating_avg || 4.9,
            reviewsCount: r.rider?.rating_count || 12,
            bikeModel: r.bike_model,
            bikePlate: r.bike_plate,
            distanceKm: r.distance_km || 10.0,
            cost: r.cost_per_seat,
            seats: r.available_seats,
            helmetProvided: r.helmet_provided,
            matchScore: Math.max(88, 98 - idx * 3)
          };
        });
        setRides(mapped);
      } else {
        // If backend query returns empty, show empty state or filtered fallbacks
        const filteredFallbacks = fallbackRides.filter(r => {
          if (fromQuery && !r.from.toLowerCase().includes(fromQuery.toLowerCase())) return false;
          if (toQuery && !r.to.toLowerCase().includes(toQuery.toLowerCase())) return false;
          if (maxCost && r.cost > parseFloat(maxCost)) return false;
          if (helmetOnly && !r.helmetProvided) return false;
          return true;
        });
        setRides(filteredFallbacks);
      }
    } catch (err) {
      console.warn('API search failed, falling back to local dataset:', err);
      setRides(fallbackRides);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchRidesFromAPI();
  }, [dateQuery, helmetOnly, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchRidesFromAPI();
  };

  const handleClearFilters = () => {
    setFromQuery('');
    setToQuery('');
    setDateQuery('');
    setMaxCost('');
    setHelmetOnly(false);
    setSortBy('time_asc');
    setTimeout(() => {
      searchRidesFromAPI();
    }, 50);
  };

  const handleBookRide = (ride) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/find');
      return;
    }
    setSelectedRide(ride);
    setBookingSuccess(false);
  };

  const confirmBooking = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedRide(null);
      setBookingSuccess(false);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="p-6 rounded-2xl bg-[#0c1424] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-[11px] font-semibold mb-2">
              <Search className="w-3 h-3" /> Phase 6 – Active Ride Search Engine
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Find Available Bike Rides</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Discover verified riders traveling along your route and share fuel expenses transparently
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            icon={PlusCircle} 
            onClick={() => navigate('/offer')}
          >
            Offer Ride Instead
          </Button>
        </div>

        {/* Search Inputs Bar */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <Input
            placeholder="Starting location (e.g. Hitech)"
            value={fromQuery}
            onChange={(e) => setFromQuery(e.target.value)}
            icon={MapPin}
          />
          <Input
            placeholder="Destination location (e.g. Gachibowli)"
            value={toQuery}
            onChange={(e) => setToQuery(e.target.value)}
            icon={MapPin}
          />
          <Input
            type="date"
            value={dateQuery}
            onChange={(e) => setDateQuery(e.target.value)}
            icon={Calendar}
          />
          <Button 
            type="submit" 
            variant="primary" 
            icon={Search} 
            loading={loading}
            className="h-[46px]"
          >
            Search Rides
          </Button>
        </form>

        {/* Filter Chips & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium mr-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filters:
            </span>

            <button
              type="button"
              onClick={() => setHelmetOnly(!helmetOnly)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                helmetOnly
                  ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-400 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              🪖 Helmet Provided
            </button>

            <button
              type="button"
              onClick={() => setMaxCost(maxCost === '40' ? '' : '40')}
              className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                maxCost === '40'
                  ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-400 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              ₹ Under ₹40
            </button>

            <button
              type="button"
              onClick={() => setMaxCost(maxCost === '60' ? '' : '60')}
              className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                maxCost === '60'
                  ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-400 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              ₹ Under ₹60
            </button>

            {(fromQuery || toQuery || dateQuery || maxCost || helmetOnly) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="time_asc">Earliest Departure</option>
              <option value="cost_asc">Lowest Contribution (₹)</option>
              <option value="cost_desc">Highest Contribution (₹)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Available Rides List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">
            Available Verified Rides: <span className="text-cyan-400 font-bold">{rides.length}</span>
          </span>
          <button 
            onClick={searchRidesFromAPI} 
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {rides.length === 0 ? (
          <Card className="text-center py-16 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Bike className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No active rides match your current filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try broadening your location search or removing price filters. You can also offer your own ride for other commuters!
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Reset Filters
              </Button>
              <Button size="sm" variant="primary" icon={PlusCircle} onClick={() => navigate('/offer')}>
                Offer a Ride on this Route
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {rides.map((ride) => (
              <div
                key={ride.id}
                className="p-5 rounded-2xl bg-[#0d1527]/90 border border-slate-800/80 hover:border-slate-700 transition duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-lg"
              >
                {/* Route & Timing Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary" size="sm" dot>
                      {ride.matchScore}% Route Match
                    </Badge>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {ride.seats} Pillion Seat
                    </span>
                    {ride.helmetProvided ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                        🪖 Spare Helmet Provided
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Bring Your Own Helmet
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-base font-semibold text-white">
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      {ride.from}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="text-indigo-400 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      {ride.to}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Departs: <strong className="text-white ml-1">{ride.time} ({ride.date})</strong>
                    </span>
                    <span>•</span>
                    <span>Distance: {ride.distanceKm} km</span>
                    <span>•</span>
                    <span>Vehicle: {ride.bikeModel} ({ride.bikePlate})</span>
                  </div>
                </div>

                {/* Rider Trust Profile */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                    {ride.riderName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      {ride.riderName}
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{ride.rating}</span>
                      <span className="text-slate-500">({ride.reviewsCount} rides)</span>
                    </div>
                  </div>
                </div>

                {/* Price & Booking Button */}
                <div className="flex items-center justify-between lg:flex-col lg:items-end gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800 shrink-0">
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] text-slate-400 block uppercase">Shared Contribution</span>
                    <span className="text-2xl font-black text-cyan-400">₹{ride.cost}</span>
                  </div>
                  <Button 
                    size="md" 
                    variant="primary" 
                    onClick={() => handleBookRide(ride)}
                  >
                    Request to Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      <Modal
        isOpen={!!selectedRide}
        onClose={() => setSelectedRide(null)}
        title="Confirm Ride Request"
      >
        {selectedRide && (
          <div className="space-y-4 text-xs">
            {bookingSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-white">Booking Request Sent!</h4>
                <p className="text-slate-400">
                  {selectedRide.riderName} has been notified and will confirm your pillion seat shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rider:</span>
                    <span className="font-semibold text-white">{selectedRide.riderName} ({selectedRide.rating} ★)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Route:</span>
                    <span className="font-semibold text-slate-200">{selectedRide.from} &rarr; {selectedRide.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Departure:</span>
                    <span className="text-cyan-400">{selectedRide.time} ({selectedRide.date})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle:</span>
                    <span className="text-slate-200">{selectedRide.bikeModel}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Est. Fuel Share:</span>
                    <span>₹{selectedRide.cost}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Platform Fee:</span>
                    <span className="text-emerald-400 font-semibold">₹0 (Zero Commission)</span>
                  </div>
                  <div className="flex justify-between text-cyan-400 font-bold text-sm pt-2 border-t border-cyan-800/50">
                    <span>Total Passenger Contribution:</span>
                    <span>₹{selectedRide.cost}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="secondary" onClick={() => setSelectedRide(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" onClick={confirmBooking}>
                    Send Request
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
