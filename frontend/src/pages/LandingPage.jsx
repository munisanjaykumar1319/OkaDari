import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Percent, 
  Users, 
  Leaf, 
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Search
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export default function LandingPage() {
  const navigate = useNavigate();
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/find?from=${encodeURIComponent(fromLocation)}&to=${encodeURIComponent(toLocation)}&date=${date}`);
  };

  const sampleRides = [
    {
      id: 1,
      from: 'Hitech City, Hyderabad',
      to: 'Gachibowli DLF',
      time: '09:00 AM Today',
      rider: 'Vikram Reddy',
      rating: '4.9 ★',
      bike: 'Royal Enfield Classic 350',
      seats: '1 Seat Left',
      contribution: '₹45',
      matchScore: '98% Route Match'
    },
    {
      id: 2,
      from: 'Indiranagar 100ft Rd',
      to: 'Electronic City Phase 1',
      time: '08:45 AM Today',
      rider: 'Ananya Sharma',
      rating: '5.0 ★',
      bike: 'Ather 450X (EV)',
      seats: '1 Seat Left',
      contribution: '₹60',
      matchScore: '94% Route Match'
    },
    {
      id: 3,
      from: 'Bandra Kurla Complex (BKC)',
      to: 'Andheri East Metro',
      time: '09:30 AM Today',
      rider: 'Siddharth Rao',
      rating: '4.8 ★',
      bike: 'Yamaha FZ-S',
      seats: '1 Seat Left',
      contribution: '₹50',
      matchScore: '91% Route Match'
    }
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Route Matching & Fair Cost Splitting</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Smart Daily Commutes. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Share Rides, Split Fuel, Save Time.
            </span>
          </h1>

          <p className="mt-6 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            The intelligent two-wheeler ride-pooling system. Connect with verified daily commuters traveling along your exact route and cut commute expenses by up to 60%.
          </p>

          {/* Quick Search Floating Box */}
          <div className="mt-10 max-w-4xl mx-auto">
            <form 
              onSubmit={handleSearch}
              className="bg-[#0b1324]/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center gap-3"
            >
              {/* Pickup Input */}
              <div className="w-full md:flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Leaving from (e.g. Hitech City)"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>

              {/* Destination Input */}
              <div className="w-full md:flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Going to (e.g. Gachibowli DLF)"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>

              {/* Date Input */}
              <div className="w-full md:w-48 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Submit CTA */}
              <Button 
                type="submit" 
                size="md" 
                variant="primary" 
                className="w-full md:w-auto shrink-0 py-3 px-6"
                icon={Search}
              >
                Find Ride
              </Button>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> 100% ID & License Verified</span>
              <span className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5 text-emerald-400" /> Transparent Zero-Commission Split</span>
              <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-teal-400" /> Low Carbon City Commute</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Available Rides Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Popular Active Rides Right Now</span>
              <Badge variant="success" dot size="sm">Live</Badge>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Top-rated riders with upcoming empty pillion seats along high-demand tech corridors
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/find')}
            icon={ArrowRight} 
            iconPosition="right"
          >
            Explore All Rides
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleRides.map((ride) => (
            <Card key={ride.id} hoverEffect className="relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="indigo" size="sm">{ride.matchScore}</Badge>
                  <span className="text-xs font-semibold text-emerald-400">{ride.seats}</span>
                </div>

                {/* Route */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5"></div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">From</span>
                      <span className="text-sm font-semibold text-white">{ride.from}</span>
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-slate-700 ml-1 h-3"></div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5"></div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">To</span>
                      <span className="text-sm font-semibold text-white">{ride.to}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Departure:</span>
                    <span className="font-semibold text-cyan-400">{ride.time}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Rider:</span>
                    <span className="font-semibold text-white">{ride.rider} ({ride.rating})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Vehicle:</span>
                    <span>{ride.bike}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Estimated Share</span>
                  <span className="text-2xl font-black text-cyan-400">{ride.contribution}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="primary"
                  onClick={() => navigate('/find')}
                >
                  Book Seat
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="primary" className="mb-3">Simplified Flow</Badge>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            How Smart Ride-Sharing Works
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            No endless haggling. Transparent routes, verified riders, and fair split calculations in 3 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center font-bold text-lg mb-4 shadow-lg shadow-cyan-500/10">
              01
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Publish or Search Route</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Riders with empty seats list their daily route and schedule. Passengers search by origin and destination.
            </p>
          </Card>

          <Card className="text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center font-bold text-lg mb-4 shadow-lg shadow-indigo-500/10">
              02
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Route Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our intelligent engine scores proximity, deviation, and departure times to connect riders along the exact pathway.
            </p>
          </Card>

          <Card className="text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center font-bold text-lg mb-4 shadow-lg shadow-emerald-500/10">
              03
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Fair Cost-Sharing & Ride</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The platform automatically computes suggested fuel contribution based on exact distance. Mutual agreement, zero hidden cuts.
            </p>
          </Card>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-cyan-900/40 via-indigo-900/40 to-slate-900 border border-cyan-500/30 p-8 sm:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Riding alone on your daily commute?
            </h2>
            <p className="text-slate-300 text-sm">
              Offer your empty pillion seat to fellow verified professionals, offset your monthly fuel expenses, and make commute enjoyable.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Button size="lg" variant="primary" onClick={() => navigate('/offer')}>
              Offer a Ride Now
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
