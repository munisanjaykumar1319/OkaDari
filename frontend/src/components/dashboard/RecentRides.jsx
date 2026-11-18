import React from 'react';
import { MapPin, Calendar, Clock, DollarSign, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function RecentRides({ rides = [], title = "Active & Recent Rides", onSelectRide }) {
  return (
    <div className="bg-[#0d1527]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400">View and manage your published or booked bike rides</p>
        </div>
        <Badge variant="primary" dot>{rides.length} Rides Active</Badge>
      </div>

      <div className="space-y-4">
        {rides.map((ride) => (
          <div
            key={ride.id}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Route & Times */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {ride.role === 'offered' ? '🏍️ You Offered' : '🎒 You Booked'}
                </span>
                <Badge 
                  variant={ride.status === 'Confirmed' ? 'success' : ride.status === 'Pending' ? 'warning' : 'default'}
                  size="sm"
                >
                  {ride.status}
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> {ride.date}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> {ride.time}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-3 text-sm font-medium text-slate-200">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{ride.from}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{ride.to}</span>
                </div>
              </div>

              {/* Bike & Co-rider */}
              <div className="text-xs text-slate-400 flex items-center gap-3">
                <span>Bike: <strong className="text-slate-300">{ride.bikeModel}</strong></span>
                <span>•</span>
                <span>Partner: <strong className="text-slate-300">{ride.partnerName}</strong></span>
                <span>•</span>
                <span className="text-emerald-400">Est. Distance: {ride.distanceKm} km</span>
              </div>
            </div>

            {/* Price & Action */}
            <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
              <div className="text-left md:text-right">
                <span className="text-xs text-slate-400 block">Shared Contribution</span>
                <span className="text-xl font-extrabold text-cyan-400">₹{ride.cost}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onSelectRide && onSelectRide(ride)}
              >
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
