import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Phone, 
  FileCheck, 
  HeartPulse, 
  Lock, 
  CheckCircle, 
  Send, 
  AlertCircle,
  X,
  PhoneCall,
  MapPin,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function SafetyHubModal({ isOpen, onClose, initialTab = 'verify' }) {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Phone Verification State
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // DL Verification State
  const [dlNumber, setDlNumber] = useState(user?.driving_license_number || '');
  const [dlLoading, setDlLoading] = useState(false);
  const [dlSuccess, setDlSuccess] = useState('');
  const [dlError, setDlError] = useState('');

  // Emergency Contact State
  const [contactName, setContactName] = useState(user?.emergency_contact_name || '');
  const [contactPhone, setContactPhone] = useState(user?.emergency_contact_phone || '');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  // Emergency SOS State
  const [sosLoading, setSosLoading] = useState(false);
  const [sosData, setSosData] = useState(null);
  const [sosError, setSosError] = useState('');

  useEffect(() => {
    if (user) {
      if (user.phone && !phoneNumber) setPhoneNumber(user.phone);
      if (user.driving_license_number && !dlNumber) setDlNumber(user.driving_license_number);
      if (user.emergency_contact_name && !contactName) setContactName(user.emergency_contact_name);
      if (user.emergency_contact_phone && !contactPhone) setContactPhone(user.emergency_contact_phone);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');
    if (!phoneNumber || phoneNumber.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await axios.post('/api/v1/safety/phone/send-otp', { phone: phoneNumber });
      setOtpSent(true);
      setMockOtp(res.data.mock_otp || '654321');
      setPhoneSuccess('OTP sent successfully to your mobile number!');
    } catch (err) {
      setPhoneError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');
    setPhoneLoading(true);
    try {
      await axios.post('/api/v1/safety/phone/verify-otp', {
        phone: phoneNumber,
        otp: otpCode,
      });
      setPhoneSuccess('Phone verified successfully! Badge active.');
      if (refreshUser) refreshUser();
    } catch (err) {
      setPhoneError(err.response?.data?.detail || 'Invalid OTP code. Please check and try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyDL = async (e) => {
    e.preventDefault();
    setDlError('');
    setDlSuccess('');
    if (!dlNumber || dlNumber.trim().length < 6) {
      setDlError('Please enter a valid Driving License number (min 6 characters).');
      return;
    }
    setDlLoading(true);
    try {
      const res = await axios.post('/api/v1/safety/license/verify', {
        driving_license_number: dlNumber,
      });
      setDlSuccess(res.data.message);
      if (refreshUser) refreshUser();
    } catch (err) {
      setDlError(err.response?.data?.detail || 'License verification failed.');
    } finally {
      setDlLoading(false);
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setContactError('');
    setContactSuccess('');
    if (!contactName || !contactPhone) {
      setContactError('Please enter both contact name and phone number.');
      return;
    }
    setContactLoading(true);
    try {
      const res = await axios.post('/api/v1/safety/emergency-contact', {
        name: contactName,
        phone: contactPhone,
      });
      setContactSuccess(res.data.message);
      if (refreshUser) refreshUser();
    } catch (err) {
      setContactError(err.response?.data?.detail || 'Failed to save emergency contact.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleTriggerSos = async () => {
    setSosError('');
    setSosLoading(true);
    try {
      const res = await axios.post('/api/v1/safety/sos', {
        current_location_name: 'Live GPS Coordinates',
        notes: 'Emergency assistance requested via RideShare Safety Hub',
      });
      setSosData(res.data);
    } catch (err) {
      setSosError(err.response?.data?.detail || 'Could not dispatch SOS. Call 112 directly!');
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-cyan-950/50 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0e1730]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Safety & Verification Center
              </h2>
              <p className="text-xs text-slate-400">
                Verified identities, emergency response & community trust
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-[#090f20] text-sm">
          <button
            onClick={() => setActiveTab('verify')}
            className={`py-3 px-4 font-semibold text-center transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'verify'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            ID Verification
          </button>
          <button
            onClick={() => setActiveTab('sos')}
            className={`py-3 px-4 font-semibold text-center transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'sos'
                ? 'border-rose-500 text-rose-400 bg-rose-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-rose-400" />
            Emergency SOS
          </button>
          <button
            onClick={() => setActiveTab('standards')}
            className={`py-3 px-4 font-semibold text-center transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'standards'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Trust & Rules
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {/* TAB 1: ID VERIFICATION */}
          {activeTab === 'verify' && (
            <div className="space-y-6">
              {/* Phone Verification Box */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h4 className="font-semibold text-white">Mobile Phone Verification</h4>
                      <p className="text-xs text-slate-400">Ensures passengers and riders can communicate directly</p>
                    </div>
                  </div>
                  {user?.is_verified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      <AlertCircle className="w-3.5 h-3.5" /> Unverified
                    </span>
                  )}
                </div>

                {phoneSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {phoneSuccess}
                  </div>
                )}
                {phoneError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {phoneError}
                  </div>
                )}

                {!user?.is_verified && (
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={phoneLoading}
                        variant="secondary"
                        size="sm"
                      >
                        {phoneLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </Button>
                    </div>

                    {otpSent && (
                      <div className="space-y-2 p-3 bg-slate-900/80 border border-cyan-500/30 rounded-xl">
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>Enter 6-digit OTP code</span>
                          <span className="text-cyan-400 font-mono">Demo OTP: {mockOtp}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="654321"
                            className="flex-1 bg-[#0b1329] border border-cyan-500/50 rounded-xl px-4 py-2 text-white text-center font-mono tracking-widest text-base focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          />
                          <Button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={phoneLoading || otpCode.length < 4}
                            variant="primary"
                            size="sm"
                          >
                            Verify & Activate
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Driving License Verification Box */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileCheck className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="font-semibold text-white">Driving License & Rider Verification</h4>
                      <p className="text-xs text-slate-400">Verifies rider legal credentials to operate personal two-wheelers</p>
                    </div>
                  </div>
                  {user?.is_dl_verified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      <ShieldCheck className="w-3.5 h-3.5" /> DL Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      Optional for Passengers
                    </span>
                  )}
                </div>

                {dlSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {dlSuccess}
                  </div>
                )}
                {dlError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {dlError}
                  </div>
                )}

                {user?.is_dl_verified ? (
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs space-y-1">
                    <p className="text-indigo-300 font-medium">Verified License Number:</p>
                    <p className="font-mono text-white text-sm tracking-wider">{user.driving_license_number}</p>
                    <p className="text-slate-400 text-[11px] pt-1">Your profile proudly showcases the 🛡️ Government DL Verified badge on all ride listings.</p>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyDL} className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={dlNumber}
                        onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. KA-04-20220012345"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <Button
                        type="submit"
                        disabled={dlLoading}
                        variant="primary"
                        size="sm"
                      >
                        {dlLoading ? 'Verifying...' : 'Verify License'}
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Riders who verify their Driving License receive up to 3x higher booking acceptance rates from trusted passengers.
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EMERGENCY SOS & CONTACTS */}
          {activeTab === 'sos' && (
            <div className="space-y-6">
              {/* Emergency SOS Banner */}
              <div className="bg-gradient-to-r from-rose-950/60 to-red-950/40 border-2 border-rose-500/40 rounded-xl p-5 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Emergency SOS Dispatch</h3>
                  <p className="text-xs text-rose-200/80 max-w-md mx-auto mt-1">
                    Pressing this button broadcasts your live ride details and coordinates to your emergency contact and displays immediate helpline access.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTriggerSos}
                    disabled={sosLoading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-base rounded-xl shadow-lg shadow-rose-600/40 hover:shadow-rose-600/60 transition transform active:scale-95 disabled:opacity-50"
                  >
                    {sosLoading ? 'DISPATCHING EMERGENCY ALERT...' : '🚨 ACTIVATE EMERGENCY SOS NOW'}
                  </button>
                </div>
              </div>

              {/* SOS Active Results */}
              {sosData && (
                <div className="bg-[#0f172a] border border-rose-500/60 rounded-xl p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between text-rose-400 font-bold border-b border-rose-500/30 pb-2">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Emergency Alert Dispatched
                    </span>
                    <span className="font-mono text-xs text-slate-400">ID: {sosData.alert_id}</span>
                  </div>

                  <p className="text-xs text-slate-300">{sosData.alert_message}</p>

                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contacts Alerted:</h5>
                    {sosData.emergency_contacts_alerted.map((c, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg text-xs">
                        <span className="font-semibold text-white">{c.name} ({c.phone})</span>
                        <span className="text-emerald-400 font-medium">{c.status}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Immediate Helplines (Click to Call):</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(sosData.helpline_numbers).map(([name, num]) => (
                        <a
                          key={name}
                          href={`tel:${num}`}
                          className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold transition"
                        >
                          <span className="truncate pr-2">{name}</span>
                          <span className="text-rose-400 font-mono font-bold flex items-center gap-1">
                            <PhoneCall className="w-3.5 h-3.5" /> {num}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact Form */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center space-x-3">
                  <HeartPulse className="w-5 h-5 text-rose-400" />
                  <div>
                    <h4 className="font-semibold text-white">Trusted Emergency Contact</h4>
                    <p className="text-xs text-slate-400">Parent, spouse, or close friend to be notified during SOS emergencies</p>
                  </div>
                </div>

                {contactSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {contactSuccess}
                  </div>
                )}
                {contactError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {contactError}
                  </div>
                )}

                <form onSubmit={handleSaveContact} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Suresh Kumar"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={contactLoading}
                      variant="primary"
                      size="sm"
                    >
                      {contactLoading ? 'Saving...' : 'Save Emergency Contact'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY STANDARDS & RULES */}
          {activeTab === 'standards' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> 1. Mandatory Helmet for Both Rider and Passenger
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Indian Motor Vehicle Act requires both rider and pillion passenger to wear certified ISI helmets. Drivers must confirm whether they provide a spare sanitized helmet.
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> 2. Non-Commercial Personal Cost-Sharing
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  RideShare operates strictly as a cost-sharing community for genuine commuters sharing personal fuel and vehicle wear expenses, capped to prevent commercial exploitation.
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> 3. Zero Tolerance for Rash Driving & Harassment
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Users reported for reckless driving, over-speeding, or improper conduct face immediate temporary suspension or permanent blocklisting from the network.
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> 4. Live Ride Tracking & Family Sharing
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Always keep your emergency contact updated so that our automated SOS trigger can instantly broadcast your live GPS trail to family members.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090f20] flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <Lock className="w-3.5 h-3.5" /> 256-bit Encrypted Safety System
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
