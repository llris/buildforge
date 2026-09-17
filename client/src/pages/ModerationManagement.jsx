import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  ShieldAlert,
  Star,
  MessageSquare,
  HelpCircle,
  Search,
  Filter,
  Eye,
  EyeOff,
  Trash2,
  Reply,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
} from 'lucide-react';

export default function ModerationManagement() {
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'qa'

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsStatus, setReviewsStatus] = useState('');

  // Q&A State
  const [questions, setQuestions] = useState([]);
  const [qaLoading, setQaLoading] = useState(true);
  const [qaPage, setQaPage] = useState(1);
  const [qaTotalPages, setQaTotalPages] = useState(1);
  const [qaTotal, setQaTotal] = useState(0);
  const [qaSearch, setQaSearch] = useState('');

  // Admin Reply Modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyingQuestion, setReplyingQuestion] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'review'|'question'|'answer', id, name }

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    } else {
      fetchQA();
    }
  }, [activeTab, reviewsPage, reviewsStatus, qaPage]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const params = new URLSearchParams({
        page: reviewsPage,
        limit: 10,
      });
      if (reviewsSearch) params.append('search', reviewsSearch);
      if (reviewsStatus) params.append('status', reviewsStatus);

      const res = await api.get(`/admin/moderation/reviews?${params.toString()}`);
      if (res.data.success) {
        setReviews(res.data.data.reviews);
        setReviewsTotalPages(res.data.data.totalPages);
        setReviewsTotal(res.data.data.total);
      }
    } catch (err) {
      showToast('Failed to load reviews', 'error');
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchQA = async () => {
    setQaLoading(true);
    try {
      const params = new URLSearchParams({
        page: qaPage,
        limit: 10,
      });
      if (qaSearch) params.append('search', qaSearch);

      const res = await api.get(`/admin/moderation/qa?${params.toString()}`);
      if (res.data.success) {
        setQuestions(res.data.data.questions);
        setQaTotalPages(res.data.data.totalPages);
        setQaTotal(res.data.data.total);
      }
    } catch (err) {
      showToast('Failed to load Q&A records', 'error');
    } finally {
      setQaLoading(false);
    }
  };

  // Review Actions
  const handleToggleReviewApproval = async (reviewId, currentApproved) => {
    try {
      const res = await api.patch(`/admin/moderation/reviews/${reviewId}`, {
        isApproved: !currentApproved,
      });
      if (res.data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, isApproved: !currentApproved } : r))
        );
        showToast(currentApproved ? 'Review hidden from store' : 'Review approved and published');
      }
    } catch (err) {
      showToast('Failed to update review status', 'error');
    }
  };

  // Q&A Question Actions
  const handleToggleQuestionApproval = async (questionId, currentApproved) => {
    try {
      const res = await api.patch(`/admin/moderation/questions/${questionId}`, {
        isApproved: !currentApproved,
      });
      if (res.data.success) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, isApproved: !currentApproved } : q))
        );
        showToast(currentApproved ? 'Question hidden' : 'Question approved');
      }
    } catch (err) {
      showToast('Failed to update question status', 'error');
    }
  };

  // Q&A Answer Actions
  const handleToggleAnswerApproval = async (questionId, answerId, currentApproved) => {
    try {
      const res = await api.patch(`/admin/moderation/answers/${answerId}`, {
        isApproved: !currentApproved,
      });
      if (res.data.success) {
        setQuestions((prev) =>
          prev.map((q) => {
            if (q.id !== questionId) return q;
            return {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId ? { ...a, isApproved: !currentApproved } : a
              ),
            };
          })
        );
        showToast(currentApproved ? 'Answer hidden' : 'Answer approved');
      }
    } catch (err) {
      showToast('Failed to update answer status', 'error');
    }
  };

  // Admin Reply
  const handleAdminReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/admin/moderation/questions/${replyingQuestion.id}/answer`, {
        content: replyContent.trim(),
      });
      if (res.data.success) {
        showToast('Official response posted successfully');
        setReplyModalOpen(false);
        setReplyContent('');
        fetchQA();
      }
    } catch (err) {
      showToast('Failed to post reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Generic Deletion
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      if (deleteTarget.type === 'review') {
        await api.delete(`/admin/moderation/reviews/${deleteTarget.id}`);
        showToast('Review deleted');
        fetchReviews();
      } else if (deleteTarget.type === 'question') {
        await api.delete(`/admin/moderation/questions/${deleteTarget.id}`);
        showToast('Question deleted');
        fetchQA();
      } else if (deleteTarget.type === 'answer') {
        await api.delete(`/admin/moderation/answers/${deleteTarget.id}`);
        showToast('Answer deleted');
        fetchQA();
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      showToast('Failed to delete item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all transform animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Moderation Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review user ratings, manage feedback, and answer product questions
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-2xl">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reviews'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Product Reviews</span>
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'qa'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Q&A Moderation</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Reviews Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setReviewsPage(1);
                fetchReviews();
              }}
              className="flex flex-col md:flex-row items-center gap-3"
            >
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reviews by title, content, or product name..."
                  value={reviewsSearch}
                  onChange={(e) => setReviewsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={reviewsStatus}
                  onChange={(e) => {
                    setReviewsStatus(e.target.value);
                    setReviewsPage(1);
                  }}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved / Visible</option>
                  <option value="hidden">Hidden</option>
                </select>

                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  Filter
                </button>
              </div>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {reviewsLoading ? (
              <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                Loading product reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200">
                No reviews found.
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition space-y-3 ${
                    rev.isApproved ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Product & User Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {rev.product?.images?.[0] ? (
                          <img
                            src={rev.product.images[0]}
                            alt={rev.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{rev.product?.name}</p>
                        <p className="text-[10px] text-slate-400">
                          Reviewed by <span className="font-bold text-slate-700">{rev.user?.name || rev.user?.email}</span> &bull;{' '}
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions & Rating */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => handleToggleReviewApproval(rev.id, rev.isApproved)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          rev.isApproved
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {rev.isApproved ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> <span>Approve</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTarget({
                            type: 'review',
                            id: rev.id,
                            name: rev.title || 'this review',
                          });
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <h4 className="text-xs font-bold text-slate-900 mb-1">{rev.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{reviews.length}</span> of{' '}
              <span className="font-bold text-slate-800">{reviewsTotal}</span> reviews
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={reviewsPage <= 1}
                onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700">
                Page {reviewsPage} of {reviewsTotalPages}
              </span>
              <button
                disabled={reviewsPage >= reviewsTotalPages}
                onClick={() => setReviewsPage((p) => Math.min(reviewsTotalPages, p + 1))}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Q&A */}
      {activeTab === 'qa' && (
        <div className="space-y-6">
          {/* Q&A Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setQaPage(1);
                fetchQA();
              }}
              className="flex items-center gap-3"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search questions by text or product name..."
                  value={qaSearch}
                  onChange={(e) => setQaSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Search
              </button>
            </form>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {qaLoading ? (
              <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                Loading questions & answers...
              </div>
            ) : questions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200">
                No questions found.
              </div>
            ) : (
              questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
                >
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {q.product?.images?.[0] ? (
                          <img
                            src={q.product.images[0]}
                            alt={q.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">{q.product?.name}</p>
                        <p className="text-[10px] text-slate-400">
                          Asked by <span className="font-bold text-slate-700">{q.user?.name || q.user?.email}</span> &bull;{' '}
                          {new Date(q.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleQuestionApproval(q.id, q.isApproved)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          q.isApproved
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {q.isApproved ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> <span>Approve</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setReplyingQuestion(q);
                          setReplyContent('');
                          setReplyModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Answer as Admin</span>
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTarget({
                            type: 'question',
                            id: q.id,
                            name: q.question,
                          });
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-950 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{q.question}</span>
                    </p>
                  </div>

                  {/* Answers Thread */}
                  <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Answers ({q.answers?.length || 0})
                    </p>
                    {q.answers?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No answers yet.</p>
                    ) : (
                      q.answers?.map((ans) => (
                        <div
                          key={ans.id}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                            ans.user?.role === 'ADMIN'
                              ? 'bg-purple-50/40 border-purple-200'
                              : 'bg-slate-50 border-slate-200/80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-900">
                                {ans.user?.name || ans.user?.email}
                              </span>
                              {ans.user?.role === 'ADMIN' && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-600 text-white">
                                  Official Staff
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {new Date(ans.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700">{ans.answer}</p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                handleToggleAnswerApproval(q.id, ans.id, ans.isApproved)
                              }
                              className={`p-1.5 rounded-lg text-xs font-bold transition ${
                                ans.isApproved
                                  ? 'text-slate-400 hover:text-slate-700'
                                  : 'text-emerald-600 bg-emerald-50'
                              }`}
                              title={ans.isApproved ? 'Hide answer' : 'Approve answer'}
                            >
                              {ans.isApproved ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'answer',
                                  id: ans.id,
                                  name: ans.answer,
                                });
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Q&A Pagination */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{questions.length}</span> of{' '}
              <span className="font-bold text-slate-800">{qaTotal}</span> questions
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={qaPage <= 1}
                onClick={() => setQaPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700">
                Page {qaPage} of {qaTotalPages}
              </span>
              <button
                disabled={qaPage >= qaTotalPages}
                onClick={() => setQaPage((p) => Math.min(qaTotalPages, p + 1))}
                className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answer as Admin Modal */}
      {replyModalOpen && replyingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Post Official Admin Answer</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  {replyingQuestion.product?.name}
                </p>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900">
              <span className="font-bold">Customer Question:</span> "{replyingQuestion.question}"
            </div>

            <form onSubmit={handleAdminReplySubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Your Answer (Will display Official Staff badge) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Provide detailed technical clarity or compatibility confirmation..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Official Answer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Delete {deleteTarget.type.toUpperCase()}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this {deleteTarget.type}? This action
                cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
