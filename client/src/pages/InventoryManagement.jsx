import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Minus,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
} from 'lucide-react';

export default function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjust Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustMode, setAdjustMode] = useState('set'); // 'set' | 'delta'
  const [targetStock, setTargetStock] = useState(0);
  const [deltaStock, setDeltaStock] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchInventory();
  }, [page, lowStockOnly]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
      });
      if (search) params.append('search', search);
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const res = await api.get(`/admin/inventory?${params.toString()}`);
      if (res.data.success) {
        setItems(res.data.data.items);
        setTotalPages(res.data.data.totalPages);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      showToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInventory();
  };

  const openAdjustModal = (item) => {
    setSelectedItem(item);
    setAdjustMode('set');
    setTargetStock(item.stockQty);
    setDeltaStock(0);
    setThreshold(item.lowStockThreshold || 5);
    setReason('');
    setFormError('');
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setFormError('A reason is mandatory for all inventory adjustments');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        reason: reason.trim(),
        lowStockThreshold: Number(threshold),
      };

      if (adjustMode === 'set') {
        payload.stockQty = Number(targetStock);
      } else {
        payload.adjustment = Number(deltaStock);
      }

      const res = await api.patch(`/admin/inventory/${selectedItem.productId}`, payload);
      if (res.data.success) {
        showToast('Inventory updated successfully');
        setAdjustModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to update inventory';
      setFormError(msg);
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
            Inventory & Stock
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time warehouse quantities, reservations, and stock audit logging
          </p>
        </div>

        <button
          onClick={() => {
            setLowStockOnly(!lowStockOnly);
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border shadow-sm ${
            lowStockOnly
              ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{lowStockOnly ? 'Showing Low Stock Only' : 'Filter Low Stock'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product inventory by name or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Total In Stock</th>
                <th className="py-3 px-4">Reserved</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading inventory records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                items.map((inv) => {
                  const available = Math.max(0, inv.stockQty - (inv.reservedQty || 0));
                  const isLow = inv.stockQty <= inv.lowStockThreshold;
                  const isOut = inv.stockQty === 0;

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isLow ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Product details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {inv.product?.images?.[0] ? (
                              <img
                                src={inv.product.images[0]}
                                alt={inv.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-xs">
                              {inv.product?.name}
                            </p>
                            <p className="text-[10px] text-slate-400">{inv.product?.brand}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-slate-600 font-medium">
                          {inv.product?.category?.name || 'General'}
                        </span>
                      </td>

                      {/* Stock Quantities */}
                      <td className="py-3 px-4 font-black text-slate-900 text-sm">
                        {inv.stockQty}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-500">
                        {inv.reservedQty || 0}
                      </td>

                      <td className="py-3 px-4 font-bold text-blue-600">
                        {available}
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {inv.lowStockThreshold}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> LOW STOCK
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            IN STOCK
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openAdjustModal(inv)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition font-bold text-xs flex items-center gap-1.5 ml-auto"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{items.length}</span> of{' '}
            <span className="font-bold text-slate-800">{total}</span> items
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  {selectedItem.product?.name}
                </p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {/* Current Quantity Info */}
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200/80">
                <span className="text-xs font-bold text-slate-600">Current Stock Quantity</span>
                <span className="text-base font-black text-slate-900">{selectedItem.stockQty} units</span>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAdjustMode('set')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    adjustMode === 'set' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Set Exact Quantity
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('delta')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    adjustMode === 'delta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Relative Add / Remove (+ / -)
                </button>
              </div>

              {/* Quantity Inputs */}
              {adjustMode === 'set' ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    New Total Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={targetStock}
                    onChange={(e) => setTargetStock(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Adjustment Amount (+ to add, - to subtract) *
                  </label>
                  <input
                    type="number"
                    required
                    value={deltaStock}
                    onChange={(e) => setDeltaStock(e.target.value)}
                    placeholder="e.g. +15 or -3"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Calculated Result:{' '}
                    <span className="font-bold text-slate-800">
                      {Math.max(0, selectedItem.stockQty + Number(deltaStock || 0))} units
                    </span>
                  </p>
                </div>
              )}

              {/* Low stock threshold */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Low Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Mandatory Reason Note */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Reason for Adjustment *
                  </label>
                  <span className="text-[10px] text-rose-500 font-bold">Mandatory Audit Field</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Restock shipment receipt, inventory count discrepancy, returned goods"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
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
                  <span>Save Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
