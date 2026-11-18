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

  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phone || '');
      setDlNumber(user.driving_license_number || '');
      setContactName(user.emergency_contact_name || '');
      setContactPhone(user.emergency_contact_phone || '');
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
        otp_code: otpCode.trim()
      });
      setPhoneSuccess('🎉 Phone number successfully verified!');
      setOtpSent(false);
      setOtpCode('');
      if (refreshUser) refreshUser();
    } catch (err) {
      setPhoneError(err.response?.data?.detail || 'Invalid OTP code. Please verify and retry.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyDL = async (e) => {
    e.preventDefault();
    setDlError('');
    setDlSuccess('');
    if (!dlNumber || dlNumber.trim().length < 8) {
      setDlError('Please enter a valid Government Driving License number.');
      return;
    }
    setDlLoading(true);
    try {
      const res = await axios.post('/api/v1/safety/driving-license/verify', {
        license_number: dlNumber.trim()
      });
      setDlSuccess(res.data.message || 'Driving License verified successfully!');
      if (refreshUser) refreshUser();
    } catch (err) {
      setDlError(err.response?.data?.detail || 'DL verification failed. Please check license number format.');
    } finally {
      setDlLoading(false);
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setContactError('');
    setContactSuccess('');
    if (!contactName.trim() || !contactPhone.trim()) {
      setContactError('Please provide both emergency contact name and phone number.');
      return;
    }
    setContactLoading(true);
    try {
      await axios.post('/api/v1/safety/emergency-contact', {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relationship: 'Family/Close Contact'
      });
      setContactSuccess('Emergency contact updated successfully!');
      if (refreshUser) refreshUser();
    } catch (err) {
      setContactError(err.response?.data?.detail || 'Failed to update emergency contact.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleTriggerSos = async () => {
    if (!confirm('🚨 Are you sure you want to trigger the Emergency SOS protocol? This will dispatch alerts to your emergency contact.')) return;
    setSosLoading(true);
    try {
      const res = await axios.post('/api/v1/safety/sos/trigger', {
        current_lat: 17.4483,
        current_lon: 78.3915,
        location_name: 'Near Hitech City Cyber Towers, Hyderabad'
      });
      setSosData(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to dispatch SOS alert. Please dial 112 immediately.');
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Safety & Verification Center
              </h2>
              <p className="text-xs text-gray-500">
                Verified identities, emergency response & community trust
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 text-sm">
          <button
            onClick={() => setActiveTab('verify')}
            className={`py-3 px-4 font-semibold text-center transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'verify'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            ID Verification
          </button>
          <button
            onClick={() => setActiveTab('sos')}
            className={`py-3 px-4 font-semibold text-center transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'sos'
                ? 'border-red-600 text-red-600 bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-red-600" />
            Emergency SOS
          </button>
          <button
            onClick={() => setActiveTab('standards')}
            className={`py-3 px-4 font-semibold text-center transition flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'standards'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            Trust & Rules
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-700 text-sm">
          {/* TAB 1: ID VERIFICATION */}
          {activeTab === 'verify' && (
            <div className="space-y-6">
              {/* Phone Verification Box */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Mobile Phone Verification</h4>
                      <p className="text-xs text-gray-500">Ensures passengers and riders can communicate directly</p>
                    </div>
                  </div>
                  {user?.is_verified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5" /> Unverified
                    </span>
                  )}
                </div>

                {phoneSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {phoneSuccess}
                  </div>
                )}
                {phoneError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
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
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
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
                      <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>Enter 6-digit OTP code</span>
                          <span className="text-blue-700 font-mono font-semibold">Demo OTP: {mockOtp}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="654321"
                            className="flex-1 bg-white border border-blue-300 rounded-xl px-4 py-2 text-gray-900 text-center font-mono tracking-widest text-base focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Driving License & Rider Verification</h4>
                      <p className="text-xs text-gray-500">Verifies rider legal credentials to operate personal two-wheelers</p>
                    </div>
                  </div>
                  {user?.is_dl_verified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <ShieldCheck className="w-3.5 h-3.5" /> DL Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                      Optional for Passengers
                    </span>
                  )}
                </div>

                {dlSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {dlSuccess}
                  </div>
                )}
                {dlError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {dlError}
                  </div>
                )}

                {user?.is_dl_verified ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                    <p className="text-blue-700 font-medium">Verified License Number:</p>
                    <p className="font-mono text-gray-900 text-sm tracking-wider font-bold">{user.driving_license_number}</p>
                    <p className="text-gray-500 text-[11px] pt-1">Your profile proudly showcases the 🛡️ Government DL Verified badge on all ride listings.</p>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyDL} className="space-y-3 pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={dlNumber}
                        onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. KA-04-20220012345"
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 font-mono uppercase placeholder-gray-400 focus:outline-none focus:border-blue-500"
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
                    <p className="text-[11px] text-gray-500">
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
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-red-100 text-red-600 border border-red-300 animate-pulse">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Emergency SOS Dispatch</h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto mt-1">
                    Pressing this button broadcasts your live ride details and coordinates to your emergency contact and displays immediate helpline access.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTriggerSos}
                    disabled={sosLoading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {sosLoading ? 'DISPATCHING EMERGENCY ALERT...' : '🚨 ACTIVATE EMERGENCY SOS NOW'}
                  </button>
                </div>
              </div>

              {/* SOS Active Results */}
              {sosData && (
                <div className="bg-white border border-red-300 rounded-xl p-5 space-y-4 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between text-red-600 font-bold border-b border-red-100 pb-2">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Emergency Alert Dispatched
                    </span>
                    <span className="font-mono text-xs text-gray-500">ID: {sosData.alert_id}</span>
                  </div>

                  <p className="text-xs text-gray-700">{sosData.alert_message}</p>

                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contacts Alerted:</h5>
                    {sosData.emergency_contacts_alerted.map((c, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-2.5 rounded-lg text-xs">
                        <span className="font-semibold text-gray-900">{c.name} ({c.phone})</span>
                        <span className="text-emerald-600 font-medium">{c.status}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Immediate Helplines (Click to Call):</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(sosData.helpline_numbers).map(([name, num]) => (
                        <a
                          key={name}
                          href={`tel:${num}`}
                          className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-900 font-semibold transition"
                        >
                          <span className="truncate pr-2">{name}</span>
                          <span className="text-red-600 font-mono font-bold flex items-center gap-1">
                            <PhoneCall className="w-3.5 h-3.5" /> {num}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact Form */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center space-x-3">
                  <HeartPulse className="w-5 h-5 text-red-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Trusted Emergency Contact</h4>
                    <p className="text-xs text-gray-500">Parent, spouse, or close friend to be notified during SOS emergencies</p>
                  </div>
                </div>

                {contactSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {contactSuccess}
                  </div>
                )}
                {contactError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {contactError}
                  </div>
                )}

                <form onSubmit={handleSaveContact} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Suresh Kumar"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500"
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
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 1. Mandatory Helmet for Both Rider and Passenger
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Indian Motor Vehicle Act requires both rider and pillion passenger to wear certified ISI helmets. Drivers must confirm whether they provide a spare sanitized helmet.
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 2. Non-Commercial Personal Cost-Sharing
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  OkaDari operates strictly as a cost-sharing community for genuine commuters sharing personal fuel and vehicle wear expenses, capped to prevent commercial exploitation.
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 3. Zero Tolerance for Rash Driving & Harassment
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Users reported for reckless driving, over-speeding, or improper conduct face immediate temporary suspension or permanent blocklisting from the network.
                </p>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> 4. Live Ride Tracking & Family Sharing
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Always keep your emergency contact updated so that our automated SOS trigger can instantly broadcast your live GPS trail to family members.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
          <span className="flex items-center gap-1.5 text-blue-600 font-medium">
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
