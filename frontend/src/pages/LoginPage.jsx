import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bike, Mail, Lock, LogIn, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPw) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPw);
      navigate('/dashboard');
    } catch (err) {
      setError('Could not connect to demo account. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F8FAFC]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#2563EB] flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Bike className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welcome to OkaDari</h1>
          <p className="text-xs text-gray-500">
            Sign in to access your ride matches, schedules, and live tracking dashboard
          </p>
        </div>

        <Card className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="pt-4 border-t border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Quick Demo Logins:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('rohit@example.com', 'mock_hashed_password_for_phase_3')}
                className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-500 text-gray-700 transition text-left"
              >
                <div className="font-semibold text-blue-600">🏍️ Rohit (Rider)</div>
                <div className="text-[10px] text-gray-400 truncate">rohit@example.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('priya@example.com', 'mock_hashed_password_for_phase_3')}
                className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-500 text-gray-700 transition text-left"
              >
                <div className="font-semibold text-blue-600">🎒 Priya (Pass.)</div>
                <div className="text-[10px] text-gray-400 truncate">priya@example.com</div>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 pt-2">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1">
              Register now <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
