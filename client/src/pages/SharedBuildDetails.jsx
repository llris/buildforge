import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import SEO from '../components/Common/SEO';
import { Skeleton } from '../components/Common/Skeleton';
import EmptyState from '../components/Common/EmptyState';
import { formatINR, formatProductTitle } from '../utils/productUtils';
import {
  Share2,
  Copy,
  Check,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Cpu,
  Eye,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Package,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';

export default function SharedBuildDetails() {
  const { shareId } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  useEffect(() => {
    fetchSharedBuild();
  }, [shareId]);

  const fetchSharedBuild = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/builds/shared/${shareId}`);
      if (res.data.success) {
        setBuild(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Build not found or link has expired');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleClone = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/builds/${shareId}` } } });
      return;
    }

    setCloning(true);
    try {
      const res = await api.post(`/builds/shared/${shareId}/clone`);
      if (res.data.success) {
        navigate('/builds');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to clone build');
    } finally {
      setCloning(false);
    }
  };

  const handleAddAllToCart = async () => {
    if (!build?.components) return;
    setAddingToCart(true);
    try {
      const parts = [];
      Object.values(build.components).forEach((comp) => {
        if (!comp) return;
        if (Array.isArray(comp)) parts.push(...comp);
        else parts.push(comp);
      });

      for (const part of parts) {
        await addToCart(part.id, 1);
      }

      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add parts to cart', err);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-10 w-1/3 rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <EmptyState
          icon={Layers}
          title="Shared Build Not Found"
          description={error || 'This build configuration is either private or does not exist.'}
          actionText="Browse Build Gallery"
          actionLink="/gallery"
        />
      </div>
    );
  }

  const componentsList = [
    { key: 'CPU', item: build.components.cpu },
    { key: 'Motherboard', item: build.components.motherboard },
    { key: 'Graphics Card (GPU)', item: build.components.gpu },
    { key: 'Memory (RAM)', item: build.components.ram, isArray: true },
    { key: 'Storage (SSD/HDD)', item: build.components.storage, isArray: true },
    { key: 'Power Supply (PSU)', item: build.components.psu },
    { key: 'PC Case', item: build.components.case },
    { key: 'CPU Cooler', item: build.components.cooler },
  ];

  const isValid = build.validation?.valid ?? true;
  const wattage = build.validation?.estimatedWattage || 350;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <SEO
        title={`${build.name} - Custom PC Build`}
        description={build.description || `Inspect the ${build.name} PC build with verified hardware compatibility and instant component cloning on BuildForge.`}
        image={build.ogImage}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {build.useCase || 'PC Build'}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold pl-2">
                <Eye className="w-3.5 h-3.5" />
                <span>{build.viewCount} views</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {build.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configured by <span className="font-bold text-slate-800 dark:text-slate-200">{build.creator?.name}</span> &bull;{' '}
              Published on {new Date(build.createdAt).toLocaleDateString()}
            </p>
            {build.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 max-w-2xl leading-relaxed">
                {build.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleClone}
              disabled={cloning}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {cloning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>Clone to My Builder</span>
            </button>
          </div>
        </div>

        {/* Compatibility & Performance Banner */}
        <div
          className={`rounded-3xl p-6 border flex flex-col md:flex-row items-center justify-between gap-6 ${
            isValid
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isValid
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isValid ? <ShieldCheck className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                    isValid
                      ? 'bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-200/60 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {isValid ? '100% Compatible' : 'Compatibility Issues Detected'}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {isValid
                  ? 'All hardware clearances, socket types & power tolerances verified'
                  : 'Some components have physical or socket incompatibilities'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-6 text-center shrink-0">
            <div className="bg-white/80 dark:bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estimated Wattage
              </span>
              <p className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{wattage} W</span>
              </p>
            </div>

            {build.buildScore && (
              <div className="bg-white/80 dark:bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Build Score
                </span>
                <p className="text-base font-black text-blue-600 dark:text-blue-400">
                  {build.buildScore}/100
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Parts Breakdown & Cart Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Parts List (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Component Breakdown
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                {componentsList.reduce((acc, c) => acc + (c.isArray ? (c.item?.length || 0) : c.item ? 1 : 0), 0)} Selected
              </span>
            </div>

            <div className="space-y-3">
              {componentsList.map(({ key, item, isArray }) => {
                if (isArray) {
                  const arr = Array.isArray(item) ? item : item ? [item] : [];
                  if (arr.length === 0) return null;
                  return arr.map((subItem, idx) => (
                    <ComponentRow
                      key={`${key}-${idx}`}
                      categoryName={`${key} #${idx + 1}`}
                      product={subItem}
                    />
                  ));
                }

                if (!item) return null;
                return <ComponentRow key={key} categoryName={key} product={item} />;
              })}
            </div>
          </div>

          {/* Cart & Total Card (1 Column) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 sticky top-24">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Complete Rig Summary
                </span>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                    {formatINR(build.totalPrice)}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Tax Included
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Hardware Subtotal</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatINR(build.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Build Guarantee</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">2-Year RMA Covered</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleAddAllToCart}
                  disabled={addingToCart}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-60"
                >
                  {addingToCart ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : cartSuccess ? (
                    <Check className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  <span>{cartSuccess ? 'Added to Cart!' : 'Add All to Shopping Cart'}</span>
                </button>

                <button
                  onClick={handleClone}
                  disabled={cloning}
                  className="w-full py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Customize in Builder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentRow({ categoryName, product }) {
  if (!product) return null;
  const cleanTitle = formatProductTitle(product);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={cleanTitle} className="w-full h-full object-contain p-1" />
          ) : (
            <Package className="w-5 h-5 text-slate-400" />
          )}
        </div>

        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {categoryName}
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
            {cleanTitle}
          </h3>
          <p className="text-[10px] text-slate-400 truncate">
            {product.brand} &bull; {product.slug}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0 flex items-center gap-4">
        <p className="text-sm font-black text-slate-900 dark:text-slate-100">
          {formatINR(product.discountPrice || product.price)}
        </p>
        <Link
          to={`/products/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
          title="View product details"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
