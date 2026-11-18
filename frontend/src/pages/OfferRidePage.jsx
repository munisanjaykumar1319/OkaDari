import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import Card, { CardHeader } from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function OfferRidePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    from: 'Hitech City, Hyderabad',
    to: 'Gachibowli DLF, Hyderabad',
    date: '2026-11-19',
    time: '09:00',
    distanceKm: '12',
    bikeModel: 'Royal Enfield Hunter 350',
    bikePlate: 'TS 09 EZ 4589',
    seats: '1',
    helmetProvided: true,
    suggestedCost: '45',
    customCost: '45',
  });

  const [published, setPublished] = useState(false);

  const calculateCost = (dist) => {
    const km = parseFloat(dist) || 0;
    // Assume average mileage 35 km/l, petrol ₹105/l => approx ₹3/km fuel cost.
    // 50% fair passenger split = km * 1.5 rounded to nearest ₹5
    const fuelCost = km * 3;
    const fairSplit = Math.round((fuelCost * 0.5) / 5) * 5 || 20;
    return fairSplit;
  };

  const handleDistanceChange = (e) => {
    const dist = e.target.value;
    const fair = calculateCost(dist);
    setFormData({
      ...formData,
      distanceKm: dist,
      suggestedCost: fair.toString(),
      customCost: fair.toString(),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPublished(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2200);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="primary" className="mb-2">Phase 2 – Interactive UI</Badge>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Offer a Bike Ride</h1>
        <p className="text-xs text-slate-400 mt-1">
          Have an empty pillion seat on your commute? Share your route, cut your fuel bill, and travel safely together.
        </p>
      </div>

      {published ? (
        <Card className="text-center py-16 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-white">Ride Published Successfully!</h2>
          <p className="text-xs text-slate-400">
            Your ride from <strong className="text-white">{formData.from}</strong> to <strong className="text-white">{formData.to}</strong> is now live. Redirecting to your dashboard...
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader 
                title="1. Route & Schedule" 
                subtitle="Where and when are you starting your journey?" 
              />
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Starting Location"
                    placeholder="e.g. Kondapur Signal"
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    icon={MapPin}
                    required
                  />
                  <Input
                    label="Destination Location"
                    placeholder="e.g. Financial District"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    icon={MapPin}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    icon={Calendar}
                    required
                  />
                  <Input
                    label="Departure Time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    icon={Clock}
                    required
                  />
                  <Input
                    label="Estimated Distance (km)"
                    type="number"
                    value={formData.distanceKm}
                    onChange={handleDistanceChange}
                    required
                  />
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader 
                title="2. Two-Wheeler & Seat Details" 
                subtitle="Ensure passengers know your vehicle and safety amenities" 
              />
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Bike Make & Model"
                    placeholder="e.g. RE Hunter 350 / Ather 450X"
                    value={formData.bikeModel}
                    onChange={(e) => setFormData({ ...formData, bikeModel: e.target.value })}
                    icon={Bike}
                    required
                  />
                  <Input
                    label="Registration Number"
                    placeholder="e.g. TS 09 EZ 4589"
                    value={formData.bikePlate}
                    onChange={(e) => setFormData({ ...formData, bikePlate: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <input
                    type="checkbox"
                    id="helmet"
                    checked={formData.helmetProvided}
                    onChange={(e) => setFormData({ ...formData, helmetProvided: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-cyan-500 focus:ring-offset-0"
                  />
                  <label htmlFor="helmet" className="text-xs text-slate-300 font-medium cursor-pointer">
                    I provide a clean spare helmet for the pillion passenger (recommended)
                  </label>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader 
                title="3. Transparent Cost-Sharing Contribution" 
                subtitle="Fair formula: (Estimated Fuel Expense / 2) with zero commercial profit" 
              />
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Estimated One-Way Fuel Expense:</span>
                    <span>₹{parseInt(formData.distanceKm || 0) * 3}</span>
                  </div>
                  <div className="flex justify-between text-cyan-400 font-bold text-sm pt-1 border-t border-cyan-800/40">
                    <span>Suggested Fair Passenger Share (50%):</span>
                    <span>₹{formData.suggestedCost}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <Input
                    label="Your Expected Passenger Share (₹)"
                    type="number"
                    value={formData.customCost}
                    onChange={(e) => setFormData({ ...formData, customCost: e.target.value })}
                    icon={DollarSign}
                    required
                  />
                  <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-4">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Cost-sharing covers fuel and maintenance only in compliance with peer ride-pooling guidelines.</span>
                  </div>
                </div>
              </div>
            </Card>

            <Button type="submit" size="lg" variant="primary" className="w-full">
              Publish Ride Listing
            </Button>
          </form>

          {/* Live Preview Column */}
          <div className="space-y-4">
            <div className="sticky top-24 space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Live Listing Preview
              </span>

              <Card glow className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm" dot>Active Listing</Badge>
                  <span className="text-xs font-semibold text-emerald-400">1 Seat</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{formData.from || 'Origin'}</span>
                  </div>
                  <div className="border-l-2 border-dashed border-slate-700 ml-1.5 h-3"></div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{formData.to || 'Destination'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-cyan-400">{formData.date} at {formData.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bike:</span>
                    <span>{formData.bikeModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Helmet:</span>
                    <span className={formData.helmetProvided ? 'text-emerald-400' : 'text-slate-400'}>
                      {formData.helmetProvided ? 'Provided' : 'Bring your own'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Expected Share:</span>
                  <span className="text-2xl font-black text-cyan-400">₹{formData.customCost || 0}</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
