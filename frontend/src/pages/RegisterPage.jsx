import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bike, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card, { CardHeader } from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'both',
    bike_model: '',
    bike_plate: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const isRiderRole = formData.role === 'rider' || formData.role === 'both';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center space-y-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
          <Bike className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Create Your Commuter Account</h1>
        <p className="text-xs text-slate-400">
          Join our verified smart bike ride-sharing community and travel safer together
        </p>
      </div>

      <Card className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Your Commuter Role <span className="text-cyan-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'rider', title: 'Rider Only', desc: 'Offer empty seats', icon: '🏍️' },
                { id: 'passenger', title: 'Passenger', desc: 'Find rides', icon: '🎒' },
                { id: 'both', title: 'Both', desc: 'Ride & share', icon: '⚡' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setFormData({ ...formData, role: r.id })}
                  className={`p-3.5 rounded-xl border text-left transition duration-150 ${
                    formData.role === r.id
                      ? 'bg-cyan-950/60 border-cyan-500/80 ring-1 ring-cyan-500/40 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xl mb-1">{r.icon}</div>
                  <div className="text-xs font-bold text-white">{r.title}</div>
                  <div className="text-[10px] text-slate-400">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Account Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Vikram Reddy"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                icon={User}
                required
              />
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                icon={Phone}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={Mail}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                icon={Lock}
                required
              />
            </div>
          </div>

          {/* Section 3: Bike Details (Shown if Rider or Both) */}
          {isRiderRole && (
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Bike className="w-4 h-4" /> Two-Wheeler Specifications
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bike Make & Model"
                  placeholder="e.g. Royal Enfield Hunter 350"
                  value={formData.bike_model}
                  onChange={(e) => setFormData({ ...formData, bike_model: e.target.value })}
                  required={formData.role === 'rider'}
                />
                <Input
                  label="Registration Plate Number"
                  placeholder="e.g. TS 09 EZ 4589"
                  value={formData.bike_plate}
                  onChange={(e) => setFormData({ ...formData, bike_plate: e.target.value })}
                  required={formData.role === 'rider'}
                />
              </div>
            </div>
          )}

          {/* Section 4: Emergency Contact */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <HeartHandshake className="w-4 h-4" /> Emergency Contact (Safety Protocol)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Emergency Contact Name"
                placeholder="e.g. Family member / Close contact"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
              <Input
                label="Emergency Contact Phone"
                placeholder="+91 98765 00000"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            Complete Registration & Join
          </Button>

          <div className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1">
              Sign In <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
