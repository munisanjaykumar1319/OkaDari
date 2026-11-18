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
      <div className="space-y-5 text-xs text-slate-200">
        {/* Top Highlight Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">Non-Profit Peer Split ({dist} km)</span>
          </div>
          <Badge variant="success" size="sm" dot>Zero Platform Commission</Badge>
        </div>

        {/* Itemized Calculation */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              {isEv ? <Zap className="w-3.5 h-3.5 text-cyan-400" /> : <Fuel className="w-3.5 h-3.5 text-amber-400" />}
              {isEv ? 'Electricity Charging' : 'Direct Fuel (Petrol @ ₹105/L)'}:
            </span>
            <span className="font-mono font-semibold text-slate-200">₹{fuelCost}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-purple-400" />
              Wear & Tear (Tire/Oil Maintenance):
            </span>
            <span className="font-mono font-semibold text-slate-200">₹{maintenanceCost}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-300">
            <span className="font-semibold">Total Operating Cost for 2-Wheeler:</span>
            <span className="font-mono font-bold text-white">₹{totalTripCost}</span>
          </div>
        </div>

        {/* 50 / 50 Fair Mutual Split */}
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 space-y-3">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            50% Fair Mutual Contribution Ratio
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Rider Fair Share (50%)</span>
              <span className="text-lg font-black text-white">₹{riderShare}</span>
              <span className="text-[10px] text-slate-500 block">Absorbs fuel & riding</span>
            </div>

            <div className="p-3 rounded-lg bg-cyan-950/90 border border-cyan-600/60">
              <span className="text-cyan-300 text-[10px] block font-semibold">Your Passenger Share (50%)</span>
              <span className="text-lg font-black text-cyan-400">₹{passengerShare}</span>
              <span className="text-[10px] text-cyan-300 block">Covers shared expense</span>
            </div>
          </div>
        </div>

        {/* Savings & Eco Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <TrendingDown className="w-3.5 h-3.5" /> Commute Savings
            </div>
            <div className="text-base font-extrabold text-white">Save ~₹{savings} ({savingsPercent}%)</div>
            <div className="text-[10px] text-slate-400">vs commercial cab fare ₹{cabFare}</div>
          </div>

          <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/60 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-teal-400">
              <Leaf className="w-3.5 h-3.5" /> Eco Footprint
            </div>
            <div className="text-base font-extrabold text-white">~{co2Saved} kg CO₂</div>
            <div className="text-[10px] text-slate-400">Avoided by shared pillion</div>
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
