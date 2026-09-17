import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import FormattedTerms from '../components/FormattedTerms';

export default function Terms() {
  const [termsData, setTermsData] = useState({
    version: '1.0',
    effectiveDate: '2026-08-24',
    content: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/legal/terms')
      .then((res) => {
        if (res.data?.data) {
          setTermsData(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load terms:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-800 pb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Legal & Compliance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Terms & Conditions
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Please read these terms carefully before creating an account, building custom configurations, or placing hardware orders.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5 text-xs text-gray-400 bg-gray-800/50 p-4 rounded-xl border border-gray-800 shrink-0">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Version {termsData.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Effective: {termsData.effectiveDate}</span>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-6 sm:p-10 shadow-xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <FormattedTerms content={termsData.content} isCompact={false} />
          )}
        </div>
      </div>
    </div>
  );
}
