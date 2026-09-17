import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Send,
  CornerDownRight,
  User,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

export default function QASection({ productId }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionContent, setQuestionContent] = useState('');
  const [activeAnswerId, setActiveAnswerId] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchQuestions = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await api.get(`/products/${productId}/questions`);
      setQuestions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [productId]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!questionContent.trim()) return;
    setSubmittingQuestion(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post(`/products/${productId}/questions`, {
        content: questionContent.trim(),
      });
      setQuestionContent('');
      setSuccessMsg('Your question has been posted!');
      fetchQuestions();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to post question.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleAnswerSubmit = async (e, questionId) => {
    e.preventDefault();
    if (!answerContent.trim()) return;
    setSubmittingAnswer(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post(`/questions/${questionId}/answers`, {
        content: answerContent.trim(),
      });
      setAnswerContent('');
      setActiveAnswerId(null);
      setSuccessMsg('Your answer has been submitted.');
      fetchQuestions();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to submit answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Global Alerts */}
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

      {/* Ask Question Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3>Have a question about this product?</h3>
        </div>
        <p className="text-xs text-gray-500">
          Ask our community and support specialists about compatibility, performance, dimensions, or warranties.
        </p>

        {user ? (
          <form onSubmit={handleAskQuestion} className="space-y-3 pt-2">
            <textarea
              rows={3}
              value={questionContent}
              onChange={(e) => setQuestionContent(e.target.value)}
              placeholder="e.g. Does this RAM kit support AMD EXPO 6000MHz out of the box?"
              required
              className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingQuestion || !questionContent.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingQuestion ? 'Posting...' : 'Ask Question'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-600">Please log in to submit a question.</span>
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition"
            >
              Log in
            </Link>
          </div>
        )}
      </div>

      {/* Questions & Answers List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
          Questions & Community Answers ({questions.length})
        </h3>

        {questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-8 space-y-2">
            <MessageCircle className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No questions yet</p>
            <p className="text-xs text-gray-400">
              Be the first to ask a question about specifications, dimensions, or setup!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const answers = q.answers || [];
              const isAnsweringThis = activeAnswerId === q.id;

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4"
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      Q
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 leading-snug">{q.content}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Asked by {q.user?.name || q.user?.email?.split('@')[0] || 'Customer'} &bull;{' '}
                        {new Date(q.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Answers Sub-list */}
                  {answers.length > 0 && (
                    <div className="border-l-2 border-gray-100 ml-3 pl-4 sm:pl-6 space-y-3">
                      {answers.map((ans) => {
                        const isOfficial = ['ADMIN', 'SUPPORT'].includes(ans.user?.role);

                        return (
                          <div
                            key={ans.id}
                            className={`p-3.5 rounded-xl text-xs space-y-1 ${
                              isOfficial
                                ? 'bg-blue-50/50 border border-blue-100'
                                : 'bg-gray-50 border border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">
                                {ans.user?.name || ans.user?.email?.split('@')[0] || 'Community Member'}
                              </span>
                              {isOfficial ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                                  <ShieldCheck className="w-3 h-3" />
                                  BuildForge Specialist
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-500 bg-gray-200/60 px-1.5 py-0.5 rounded">
                                  Community
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 ml-auto">
                                {new Date(ans.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed pt-0.5">{ans.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answer Input Toggle & Box */}
                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-3">
                    {!isAnsweringThis ? (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">
                          {answers.length} answer{answers.length === 1 ? '' : 's'}
                        </span>
                        {user && (
                          <button
                            onClick={() => {
                              setActiveAnswerId(q.id);
                              setAnswerContent('');
                            }}
                            className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <CornerDownRight className="w-3 h-3" />
                            <span>Answer this question</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={(e) => handleAnswerSubmit(e, q.id)} className="space-y-2">
                        <textarea
                          rows={2}
                          value={answerContent}
                          onChange={(e) => setAnswerContent(e.target.value)}
                          placeholder="Provide your helpful answer..."
                          required
                          className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setActiveAnswerId(null)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingAnswer || !answerContent.trim()}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 disabled:opacity-50"
                          >
                            {submittingAnswer ? 'Submitting...' : 'Post Answer'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
