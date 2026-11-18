import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  CheckCircle2
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

export default function FindRidePage() {
  const [searchParams] = useSearchParams();
  const [fromQuery, setFromQuery] = useState(searchParams.get('from') || '');
  const [toQuery, setToQuery] = useState(searchParams.get('to') || '');
  const [selectedRide, setSelectedRide] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const availableRides = [
    {
      id: 1,
      from: 'Hitech City Cyber Towers',
      to: 'Gachibowli Bio-Diversity Park',
      date: 'Today, Nov 18',
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
      date: 'Today, Nov 18',
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
      date: 'Today, Nov 18',
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
    },
    {
      id: 4,
      from: 'Kukatpally Housing Board (KPHB)',
      to: 'Raidurg Knowledge City',
      date: 'Today, Nov 18',
      time: '09:15 AM',
      riderName: 'Sanjay Deshmukh',
      rating: 4.7,
      reviewsCount: 15,
      bikeModel: 'Bajaj Pulsar NS200',
      bikePlate: 'TS 10 AB 3412',
      distanceKm: 15.0,
      cost: 65,
      seats: 1,
      helmetProvided: true,
      matchScore: 89
    }
  ];

  const handleBookRide = (ride) => {
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
      {/* Search & Filter Header */}
      <div className="p-6 rounded-2xl bg-[#0c1424] border border-slate-800 shadow-xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Find Available Bike Rides</h1>
          <p className="text-xs text-slate-400 mt-1">
            Discover verified bike commuters traveling your direction and share fair fuel expenses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <Input
            placeholder="Starting location"
            value={fromQuery}
            onChange={(e) => setFromQuery(e.target.value)}
            icon={MapPin}
          />
          <Input
            placeholder="Destination location"
            value={toQuery}
            onChange={(e) => setToQuery(e.target.value)}
            icon={MapPin}
          />
          <Input
            type="date"
            icon={Calendar}
          />
          <Button variant="primary" icon={Search} className="h-[46px] mt-auto">
            Search Matches
          </Button>
        </div>
      </div>

      {/* Available Rides List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">
            Found <span className="text-cyan-400">{availableRides.length}</span> verified rides along your route
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sorted by highest route similarity</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {availableRides.map((ride) => (
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
                    {ride.seats} Pillion Seat Available
                  </span>
                  {ride.helmetProvided && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                      🪖 Helmet Provided
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
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Departs: <strong className="text-white ml-1">{ride.time}</strong>
                  </span>
                  <span>•</span>
                  <span>Est. Distance: {ride.distanceKm} km</span>
                  <span>•</span>
                  <span>Bike: {ride.bikeModel} ({ride.bikePlate})</span>
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
