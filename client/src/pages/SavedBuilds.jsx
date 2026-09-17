import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../contexts/CartContext';
import SEO from '../components/Common/SEO';
import { Skeleton } from '../components/Common/Skeleton';
import EmptyState from '../components/Common/EmptyState';
import { formatINR } from '../utils/productUtils';
import {
  Layers,
  Plus,
  Share2,
  Trash2,
  Copy,
  Check,
  ShoppingCart,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  X,
  Globe,
  Lock,
  Loader2,
  Zap,
} from 'lucide-react';

export default function SavedBuilds() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingBuild, setSharingBuild] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [useCase, setUseCase] = useState('GAMING');
  const [shareUrl, setShareUrl] = useState('');
  const [submittingShare, setSubmittingShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cart adding state
  const [addingBuildId, setAddingBuildId] = useState(null);
  const [cartSuccessId, setCartSuccessId] = useState(null);

  useEffect(() => {
    fetchBuilds();
  }, []);

  const fetchBuilds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/builds');
      if (res.data.success) {
        // Enriched with real-time compatibility validation
        const enriched = await Promise.all(
          res.data.data.map(async (b) => {
            try {
              const valRes = await api.post('/builder/validate', b.components);
              return { ...b, validation: valRes.data.data.validation };
            } catch {
              return b;
            }
          })
        );
        setBuilds(enriched);
      }
    } catch (err) {
      console.error('Failed to load saved builds', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved build?')) return;
    try {
      await api.delete(`/builds/${id}`);
      setBuilds((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert('Failed to delete build');
    }
  };

  const handleLoadToBuilder = (build) => {
    try {
      localStorage.setItem('bf_builder_state', JSON.stringify(build.components));
    } catch {
      // Ignore storage errors
    }
    navigate('/builder', { state: { loadBuild: build.components } });
  };

  const handleAddToCart = async (build) => {
    setAddingBuildId(build.id);
    try {
      const parts = [];
      Object.values(build.components || {}).forEach((val) => {
        if (!val) return;
        if (Array.isArray(val)) parts.push(...val);
        else parts.push(val);
      });

      for (const p of parts) {
        const id = typeof p === 'string' ? p : p?.id;
        if (id) await addToCart(id, 1);
      }

      setCartSuccessId(build.id);
      setTimeout(() => setCartSuccessId(null), 3000);
    } catch (err) {
      console.error('Failed to add build to cart', err);
    } finally {
      setAddingBuildId(null);
    }
  };

  const openShareModal = (build) => {
    setSharingBuild(build);
    setIsPublic(build.shares?.[0]?.isPublic ?? true);
    setUseCase(build.useCase || 'GAMING');
    if (build.shares?.[0]?.shareId) {
      setShareUrl(`${window.location.origin}/builds/${build.shares[0].shareId}`);
    } else {
      setShareUrl('');
    }
    setCopied(false);
    setShareModalOpen(true);
  };

  const handleGenerateShare = async () => {
    if (!sharingBuild) return;
    setSubmittingShare(true);
    try {
      const res = await api.post(`/builds/${sharingBuild.id}/share`, {
        isPublic,
        useCase,
      });

      if (res.data.success) {
        const url = `${window.location.origin}/builds/${res.data.data.shareId}`;
        setShareUrl(url);
        // Update local build share reference
        setBuilds((prev) =>
          prev.map((b) =>
            b.id === sharingBuild.id
              ? {
                  ...b,
                  useCase,
                  shares: [{ shareId: res.data.data.shareId, isPublic: res.data.data.isPublic }],
                }
              : b
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to publish build');
    } finally {
      setSubmittingShare(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <SEO title="My Saved Builds" description="Manage and share your custom PC configurations on BuildForge." />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              My Saved Builds
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage, publish, share, and order your custom PC hardware configurations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/gallery"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Public Gallery</span>
            </Link>

            <Link
              to="/builder"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>New PC Build</span>
            </Link>
          </div>
        </div>

        {/* Builds Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm"
              >
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : builds.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No Saved Builds Yet"
            description="Use our dynamic PC Builder with real-time compatibility validation to architect your dream PC."
            actionText="Launch PC Builder"
            actionLink="/builder"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builds.map((b) => {
              const isComp = b.validation?.valid ?? true;
              const hasShare = b.shares && b.shares.length > 0;
              const isSharePublic = hasShare && b.shares[0].isPublic;

              return (
                <div
                  key={b.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                          isComp
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {isComp ? (
                          <>
                            <ShieldCheck className="w-3 h-3" /> Compatible
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Issues
                          </>
                        )}
                      </span>

                      {isSharePublic ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 truncate">
                        {b.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Saved on {new Date(b.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Quick Specs / Stats */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Total Price:</span>
                        <span className="font-black text-slate-900 dark:text-slate-100">
                          {formatINR(b.totalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Estimated Power:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          {b.validation?.estimatedWattage || 350}W
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Selected Parts:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {Object.keys(b.components || {}).filter((k) => b.components[k]).length} components
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-2 mt-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLoadToBuilder(b)}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
                      >
                        Load in Builder
                      </button>

                      <button
                        onClick={() => handleAddToCart(b)}
                        disabled={addingBuildId === b.id}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                        title="Add parts to cart"
                      >
                        {addingBuildId === b.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : cartSuccessId === b.id ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => openShareModal(b)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                        title="Share / Publish build"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 transition"
                        title="Delete build"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share / Publish Modal */}
      {shareModalOpen && sharingBuild && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Publish & Share Build
                </h3>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share <span className="font-bold text-slate-800 dark:text-slate-200">{sharingBuild.name}</span> with friends or publish it to the community gallery.
              </p>
            </div>

            {/* Public Toggle & Use Case */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Public Community Visibility
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Show in the Public Build Gallery
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Primary Category / Use Case
                </label>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="GAMING">Gaming</option>
                  <option value="WORKSTATION">Workstation & 3D</option>
                  <option value="BUDGET">Budget Value Rig</option>
                  <option value="CREATOR">Content Creation / Streaming</option>
                </select>
              </div>

              {/* Generate or Display Link */}
              {shareUrl ? (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Shareable Public URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 shadow-sm"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateShare}
                  disabled={submittingShare}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                >
                  {submittingShare && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Generate Shareable Link</span>
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
