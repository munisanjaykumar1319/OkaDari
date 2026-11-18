import React, { useState } from 'react';
import { Star, X, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import Button from '../common/Button';

export default function ReviewModal({
  isOpen,
  onClose,
  rideId,
  revieweeId,
  revieweeName,
  onSuccess,
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/v1/safety/reviews', {
        ride_id: rideId,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || undefined,
      });

      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review. You may have already reviewed this ride.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Rate Your Experience</h3>
            <p className="text-xs text-gray-500">
              Sharing feedback helps keep our community safe and reliable
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-sm">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Thank You for Your Review!</h4>
              <p className="text-xs text-gray-500">Your rating has updated {revieweeName}'s community trust score.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="text-center space-y-2">
                <p className="text-gray-700 font-medium">How was your ride with <span className="text-blue-600 font-semibold">{revieweeName || 'your co-rider'}</span>?</p>
                
                {/* 5 Star Rating */}
                <div className="flex justify-center items-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none transition transform hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-amber-500">
                  {rating === 5 && '🌟 Excellent & Super Safe!'}
                  {rating === 4 && '👍 Great Ride'}
                  {rating === 3 && '😐 Average Experience'}
                  {rating === 2 && '👎 Below Expectations'}
                  {rating === 1 && '⚠️ Poor / Unsafe'}
                </p>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Comments or Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. On-time pickup, polite, safe driving, helmet provided..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
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
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
