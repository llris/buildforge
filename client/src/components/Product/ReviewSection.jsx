import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  Edit2,
  Trash2,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export default function ReviewSection({ productId }) {
  const { user } = useAuth();
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Write Review form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  // Edit Review state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await api.get(`/products/${productId}/reviews`);
      setReviewsData(res.data.data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleCreateReview = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, {
        rating: formRating,
        title: formTitle,
        comment: formComment,
      });
      setSuccessMsg('Thank you! Your review has been posted.');
      setShowForm(false);
      setFormTitle('');
      setFormComment('');
      setFormRating(5);
      fetchReviews();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (rev) => {
    setEditingReviewId(rev.id);
    setEditRating(rev.rating);
    setEditTitle(rev.title || '');
    setEditComment(rev.comment || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setErrorMsg('');
    try {
      await api.patch(`/reviews/${editingReviewId}`, {
        rating: editRating,
        title: editTitle,
        comment: editComment,
      });
      setSuccessMsg('Review updated successfully.');
      setEditingReviewId(null);
      fetchReviews();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update review.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      setSuccessMsg('Review deleted.');
      fetchReviews();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to delete review.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const reviews = reviewsData?.reviews || [];
  const stats = reviewsData?.stats || {
    avgRating: 0,
    ratingCount: 0,
    distribution: { 5: { count: 0, pct: 0 }, 4: { count: 0, pct: 0 }, 3: { count: 0, pct: 0 }, 2: { count: 0, pct: 0 }, 1: { count: 0, pct: 0 } },
  };
  const eligibility = reviewsData?.userEligibility || {
    canReview: false,
    hasPurchased: false,
    hasDelivered: false,
    hasReviewed: false,
    existingReview: null,
  };

  return (
    <div className="space-y-10">
      {/* Top Banner Notifications */}
      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Ratings Summary & Breakdown Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Average Rating Block */}
          <div className="text-center md:text-left md:border-r border-gray-100 md:pr-8">
            <span className="text-5xl font-black text-gray-900 tracking-tight">
              {(stats.avgRating || 0).toFixed(1)}
            </span>
            <div className="flex justify-center md:justify-start text-amber-400 my-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.round(stats.avgRating || 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Based on {stats.ratingCount || 0} customer review{stats.ratingCount === 1 ? '' : 's'}
            </p>
          </div>

          {/* Star Distribution Bars */}
          <div className="space-y-2 md:col-span-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const dist = stats.distribution?.[stars] || { count: 0, pct: 0 };
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 font-bold text-gray-700">
                    <span>{stars}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${dist.pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-gray-400 font-semibold">{dist.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Eligibility / Write Review Box */}
      <div className="bg-gray-50/60 rounded-3xl border border-gray-200 p-6 sm:p-8">
        {!user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Have you purchased this product?</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Log in to write a verified review once your order has been delivered.
              </p>
            </div>
            <Link
              to="/login"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition shrink-0"
            >
              Log in to Review
            </Link>
          </div>
        ) : eligibility.canReview ? (
          <div>
            {!showForm ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-gray-900">Verified Buyer</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    You have purchased this item. Share your thoughts with the community!
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition shrink-0"
                >
                  Write a Review
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateReview} className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <h3 className="text-sm font-bold text-gray-900">Write Your Verified Review</h3>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>

                {/* Rating picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Overall Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormRating(star)}
                        className="p-1 focus:outline-none transition transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (hoverRating || formRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-gray-700 ml-2">
                      {hoverRating || formRating} of 5 stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Review Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Excellent build quality and flawless performance"
                    className="w-full text-xs sm:text-sm bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Written Feedback
                  </label>
                  <textarea
                    rows={4}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="What did you like or dislike? How does it perform in your system?"
                    required
                    className="w-full text-xs sm:text-sm bg-white border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : eligibility.hasReviewed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-gray-900">You have reviewed this product</p>
                <p className="text-[11px] text-gray-500">
                  You can modify or delete your review directly from the review list below or your dashboard.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard?tab=reviews"
              className="text-xs font-bold text-blue-600 hover:underline shrink-0"
            >
              Manage in Dashboard &rarr;
            </Link>
          </div>
        ) : !eligibility.hasPurchased ? (
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <ShieldCheck className="w-5 h-5 text-gray-400 shrink-0" />
            <span>
              <strong>Verified Reviews Only:</strong> Only customers who have ordered and received this item can write a review.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              Your order for this product is currently being processed/shipped. You can write a review once it is delivered!
            </span>
          </div>
        )}
      </div>

      {/* Customer Reviews List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
          Customer Reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-8 space-y-2">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No reviews yet</p>
            <p className="text-xs text-gray-400">
              Be the first verified customer to share your thoughts on this product!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isAuthor = user && user.id === rev.userId;
              const isEditing = editingReviewId === rev.id;

              return (
                <div
                  key={rev.id}
                  className={`bg-white rounded-2xl border p-6 shadow-sm transition space-y-3 ${
                    isAuthor ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
                  }`}
                >
                  {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs font-bold text-gray-900">Edit Your Review</span>
                        <button
                          type="button"
                          onClick={() => setEditingReviewId(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                            className="p-1 focus:outline-none"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= editRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Review title"
                        className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-2"
                      />

                      <textarea
                        rows={3}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        required
                        className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-2"
                      />

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingReviewId(null)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingEdit}
                          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingEdit ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Review Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                            {(rev.user?.name?.[0] || rev.user?.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">
                                {rev.user?.name || rev.user?.email?.split('@')[0] || 'Customer'}
                              </span>
                              {isAuthor && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  You
                                </span>
                              )}
                              {rev.isVerifiedPurchase && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {new Date(rev.createdAt).toLocaleDateString([], {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review Title & Body */}
                      {rev.title && (
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 pt-1">
                          {rev.title}
                        </h4>
                      )}
                      <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>

                      {/* Action buttons if current user */}
                      {isAuthor && (
                        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2 text-xs">
                          <button
                            onClick={() => handleStartEdit(rev)}
                            className="flex items-center gap-1 font-bold text-blue-600 hover:underline px-2 py-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="flex items-center gap-1 font-bold text-rose-600 hover:underline px-2 py-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

