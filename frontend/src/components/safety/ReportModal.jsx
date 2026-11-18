import React, { useState } from 'react';
import { AlertTriangle, UserX, X, CheckCircle, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import Button from '../common/Button';

export default function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  rideId,
  onSuccess,
}) {
  const [reason, setReason] = useState('RASH_DRIVING');
  const [description, setDescription] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!description.trim()) {
      setError('Please provide a brief description of the incident.');
      return;
    }
    setLoading(true);

    try {
      // 1. Submit incident report
      await axios.post('/api/v1/safety/report', {
        reported_user_id: reportedUserId,
        ride_id: rideId || undefined,
        reason,
        description: description.trim(),
      });

      // 2. Block user if selected
      if (alsoBlock && reportedUserId) {
        try {
          await axios.post(`/api/v1/safety/block/${reportedUserId}`);
        } catch (blockErr) {
          // Ignore if already blocked
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-[#0b1329] border border-rose-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-rose-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#140b17]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Report User</h3>
              <p className="text-xs text-slate-400">
                Reporting: <span className="text-rose-400 font-semibold">{reportedUserName || 'User'}</span>
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

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm">
          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Report Filed with Safety Team</h4>
              <p className="text-xs text-slate-400">
                We take safety violations seriously. {alsoBlock ? 'This user has also been blocked from matching with you.' : ''}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Reason for Report
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="RASH_DRIVING">Dangerous / Rash Driving or Overspeeding</option>
                  <option value="UNSAFE_BEHAVIOR">Unsafe or Inappropriate Behavior</option>
                  <option value="HARASSMENT">Harassment or Verbal Abuse</option>
                  <option value="OVERCHARGING">Demanded Excess Payment (Commercial Profiteering)</option>
                  <option value="NO_SHOW">No Show or Last Minute Abandonment</option>
                  <option value="VEHICLE_MISMATCH">Vehicle / Helmet Different from Listing</option>
                  <option value="OTHER">Other Safety Violation</option>
                </select>
              </div>

              {/* Description textarea */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Describe what happened *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide specific details about time, location, and behavior..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Block user checkbox */}
              <div className="flex items-center gap-2 pt-1 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="blockUserCheck"
                  checked={alsoBlock}
                  onChange={(e) => setAlsoBlock(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-700 bg-slate-800 cursor-pointer"
                />
                <label htmlFor="blockUserCheck" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1.5 font-medium">
                  <UserX className="w-3.5 h-3.5 text-rose-400" />
                  Block this user from seeing or matching my rides
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Incident Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
