import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/Common/SEO';
import { Skeleton } from '../components/Common/Skeleton';
import EmptyState from '../components/Common/EmptyState';
import { formatINR } from '../utils/productUtils';
import {
  Cpu,
  Monitor,
  Eye,
  Copy,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Gamepad2,
  Briefcase,
  DollarSign,
  Palette,
  Loader2,
  Check,
} from 'lucide-react';

const USE_CASES = [
  { id: 'ALL', label: 'All Builds', icon: Sparkles },
  { id: 'GAMING', label: 'Gaming', icon: Gamepad2 },
  { id: 'WORKSTATION', label: 'Workstation', icon: Briefcase },
  { id: 'BUDGET', label: 'Budget Rig', icon: DollarSign },
  { id: 'CREATOR', label: 'Content Creator', icon: Palette },
];

export default function BuildGallery() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState(null);
  const [clonedSuccessId, setClonedSuccessId] = useState(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [useCase, setUseCase] = useState('ALL');
  const [search, setSearch] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [sortBy, setSortBy] = useState('views'); // 'views' | 'newest' | 'price_asc' | 'price_desc'

  useEffect(() => {
    fetchGallery();
  }, [page, useCase, sortBy]);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 9,
        sortBy,
      });

      if (useCase !== 'ALL') params.append('useCase', useCase);
      if (search) params.append('search', search);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);

      const res = await api.get(`/builds/gallery?${params.toString()}`);
      if (res.data.success) {
        setBuilds(res.data.data.builds);
        setTotalPages(res.data.data.totalPages);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      console.error('Failed to load build gallery', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGallery();
  };

  const handleClone = async (shareId) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/builds/${shareId}` } } });
      return;
    }

    setCloningId(shareId);
    try {
      const res = await api.post(`/builds/shared/${shareId}/clone`);
      if (res.data.success) {
        setClonedSuccessId(shareId);
        setTimeout(() => {
          navigate('/builds');
        }, 800);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to clone build');
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Community PC Build Gallery"
        description="Explore top-rated, custom PC builds created by enthusiasts with real-time hardware compatibility validation."
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Gallery Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                Community Showcase
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {total} Published Builds
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              PC Build Gallery
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Discover verified PC configurations, compare specs, clone parts into your builder, or publish your own dream rig.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/builder"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Build</span>
            </Link>
          </div>
        </div>

        {/* Use Case Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            const active = useCase === uc.id;
            return (
              <button
                key={uc.id}
                onClick={() => {
                  setUseCase(uc.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{uc.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search builds by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Budget inputs */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <input
                type="number"
                placeholder="Min ₹"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-24 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-24 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="views">Most Viewed</option>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>

              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition"
              >
                Apply
              </button>
            </div>
          </form>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : builds.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No Published Builds Found"
            description="Try changing your use case filters or budget range to discover other community configurations."
            actionText="Clear Filters"
            onAction={() => {
              setUseCase('ALL');
              setSearch('');
              setMinBudget('');
              setMaxBudget('');
              setSortBy('views');
              setPage(1);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builds.map((b) => (
              <div
                key={b.shareId}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 p-6 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top metadata */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {b.useCase || 'PC Build'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{b.viewCount || 0}</span>
                    </div>
                  </div>

                  {/* Title & Creator */}
                  <Link
                    to={`/builds/${b.shareId}`}
                    className="block font-black text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate"
                  >
                    {b.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5 mb-4">
                    by <span className="font-bold text-slate-600 dark:text-slate-300">{b.creator?.name}</span> &bull;{' '}
                    {new Date(b.createdAt).toLocaleDateString()}
                  </p>

                  {/* Component Preview Highlights */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 mb-5">
                    {/* CPU */}
                    <div className="flex items-center gap-2 text-xs">
                      <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">CPU:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {b.cpu?.name || 'Custom CPU'}
                      </span>
                    </div>

                    {/* GPU */}
                    <div className="flex items-center gap-2 text-xs">
                      <Monitor className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">GPU:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {b.gpu?.name || 'Integrated / Custom GPU'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Price & Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total Cost
                    </span>
                    <p className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">
                      {formatINR(b.totalPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleClone(b.shareId)}
                      disabled={cloningId === b.shareId}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                      title="Clone this build to your builder"
                    >
                      {cloningId === b.shareId ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : clonedSuccessId === b.shareId ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <Link
                      to={`/builds/${b.shareId}`}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing page <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
