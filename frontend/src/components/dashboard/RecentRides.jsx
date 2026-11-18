import React from 'react';
import { MapPin, Calendar, Clock, DollarSign, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function RecentRides({ rides = [], title = "Active & Recent Rides", onSelectRide }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
          <p className="text-xs text-gray-500">View and manage your published or booked bike rides</p>
        </div>
        <Badge variant="primary" dot>{rides.length} Rides Active</Badge>
      </div>

      <div className="space-y-4">
        {rides.map((ride) => (
          <div
            key={ride.id}
            className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
            onClick={() => onSelectRide && onSelectRide(ride)}
          >
            {/* Route & Times */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {ride.role === 'offered' ? '🏍️ You Offered' : '🎒 You Booked'}
                </span>
                <Badge 
                  variant={ride.status === 'Confirmed' ? 'success' : ride.status === 'Pending' ? 'warning' : 'default'}
                  size="sm"
                >
                  {ride.status}
                </Badge>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" /> {ride.date}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" /> {ride.time}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-3 text-sm font-semibold text-gray-900">
                <div className="flex items-center gap-1.5 text-blue-700">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{ride.from}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex items-center gap-1.5 text-red-600">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{ride.to}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Distance: {ride.distanceKm} km</span>
                <span>•</span>
                <span>Vehicle: {ride.bikeModel}</span>
                <span>•</span>
                <span>Partner: {ride.partnerName}</span>
              </div>
            </div>

            {/* Price & Action */}
            <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-200">
              <div className="text-left md:text-right">
                <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Contribution</span>
                <span className="text-xl font-black text-blue-600">₹{ride.cost}</span>
              </div>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSelectRide && onSelectRide(ride); }}>
                Manage Ride
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
