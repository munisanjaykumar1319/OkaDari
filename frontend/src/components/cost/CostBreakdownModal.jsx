import React from 'react';
import { 
  Fuel, 
  Wrench, 
  ShieldCheck, 
  Leaf, 
  TrendingDown, 
  CheckCircle2, 
  Zap, 
  Calculator,
  X
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function CostBreakdownModal({ isOpen, onClose, distanceKm = 12.0, cost = 45.0, isEv = false }) {
  const dist = parseFloat(distanceKm) || 12.0;

  // Real formula: ~ ₹3/km fuel + ₹0.40/km maintenance
  const fuelCost = isEv ? Math.round(dist * 0.35) : Math.round(dist * 2.6);
  const maintenanceCost = Math.round(dist * 0.45);
  const totalTripCost = fuelCost + maintenanceCost;
  const passengerShare = parseFloat(cost) || Math.round(totalTripCost * 0.5);
  const riderShare = totalTripCost - passengerShare;

  // Comparison vs Ola/Uber/Auto (~ ₹18/km)
  const cabFare = Math.round(dist * 16.5 + 40);
  const savings = Math.max(0, cabFare - passengerShare);
  const savingsPercent = Math.round((savings / cabFare) * 100);
  const co2Saved = (dist * 0.115).toFixed(2);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transparent Fair Cost-Sharing Breakdown"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 text-xs text-gray-800">
        {/* Top Highlight Banner */}
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-900">Non-Profit Peer Split ({dist} km)</span>
          </div>
          <Badge variant="success" size="sm" dot>Zero Platform Commission</Badge>
        </div>

        {/* Itemized Calculation */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-1.5">
              {isEv ? <Zap className="w-3.5 h-3.5 text-blue-600" /> : <Fuel className="w-3.5 h-3.5 text-amber-500" />}
              {isEv ? 'Electricity Charging' : 'Direct Fuel (Petrol @ ₹105/L)'}:
            </span>
            <span className="font-mono font-semibold text-gray-900">₹{fuelCost}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-purple-600" />
              Wear & Tear (Tire/Oil Maintenance):
            </span>
            <span className="font-mono font-semibold text-gray-900">₹{maintenanceCost}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-gray-700">
            <span className="font-semibold">Total Operating Cost for 2-Wheeler:</span>
            <span className="font-mono font-bold text-gray-900">₹{totalTripCost}</span>
          </div>
        </div>

        {/* 50 / 50 Fair Mutual Split */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            50% Fair Mutual Contribution Ratio
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white border border-gray-200">
              <span className="text-gray-500 text-[10px] block">Rider Fair Share (50%)</span>
              <span className="text-lg font-black text-gray-900">₹{riderShare}</span>
              <span className="text-[10px] text-gray-400 block">Absorbs fuel & riding</span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-blue-300 ring-1 ring-blue-500/20">
              <span className="text-blue-700 text-[10px] block font-semibold">Your Passenger Share (50%)</span>
              <span className="text-lg font-black text-blue-600">₹{passengerShare}</span>
              <span className="text-[10px] text-blue-600 block">Covers shared expense</span>
            </div>
          </div>
        </div>

        {/* Savings & Eco Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" /> Commute Savings
            </div>
            <div className="text-base font-extrabold text-emerald-900">Save ~₹{savings} ({savingsPercent}%)</div>
            <div className="text-[10px] text-emerald-600">vs commercial cab fare ₹{cabFare}</div>
          </div>

          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-teal-700">
              <Leaf className="w-3.5 h-3.5 text-teal-600" /> Eco Footprint
            </div>
            <div className="text-base font-extrabold text-teal-900">~{co2Saved} kg CO₂</div>
            <div className="text-[10px] text-teal-600">Avoided by shared pillion</div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" variant="primary" onClick={onClose}>
            Got It, Looks Fair!
          </Button>
        </div>
      </div>
    </Modal>
  );
}
