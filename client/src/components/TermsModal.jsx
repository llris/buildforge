import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, ShieldCheck, X } from 'lucide-react';
import api from '../api/axios';
import FormattedTerms from './FormattedTerms';

export default function TermsModal({ isOpen, onClose, onAccept, isSubmitting }) {
  const [agreed, setAgreed] = useState(false);
  const [termsData, setTermsData] = useState({
    version: '1.0',
    effectiveDate: '2026-08-24',
    content: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      setLoading(true);
      api
        .get('/legal/terms')
        .then((res) => {
          if (res.data?.data) {
            setTermsData(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch terms:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Legal Terms & Compliance</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Version {termsData.version}
                </span>
                <span className="text-xs text-gray-400">
                  Effective: {termsData.effectiveDate}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Body (Solid opaque background, fixed max-height, internal scroll) */}
        <div className="p-6 overflow-y-auto max-h-[55vh] bg-gray-950 text-gray-300 text-xs sm:text-sm leading-relaxed border-b border-gray-800 select-text">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <FormattedTerms content={termsData.content} isCompact={true} />
          )}
        </div>

        {/* Footer with Document Links, Checkbox, and Action Buttons */}
        <div className="p-6 bg-gray-900 space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
            <span className="text-gray-500">Read full policies:</span>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>Terms & Conditions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-gray-700">•</span>
            <a
              href="/disclaimer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>Disclaimer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-gray-700">•</span>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <span>Privacy Policy</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-start gap-3 select-none pt-1">
            <input
              id="signup-terms-checkbox"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isSubmitting}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer shrink-0"
            />
            <label htmlFor="signup-terms-checkbox" className="text-xs sm:text-sm text-gray-300 leading-snug cursor-pointer">
              I have read and agree to the{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-400 hover:text-blue-300 underline font-semibold"
              >
                Terms and Conditions
              </a>
              ,{' '}
              <a
                href="/disclaimer"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-amber-400 hover:text-amber-300 underline font-semibold"
              >
                Disclaimer
              </a>
              , and{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-emerald-400 hover:text-emerald-300 underline font-semibold"
              >
                Privacy Policy
              </a>
              .
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-300 text-xs sm:text-sm font-semibold hover:bg-gray-700 hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={!agreed || isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-blue-200" />
              <span>{isSubmitting ? 'Creating Account...' : 'Accept & Create Account'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
