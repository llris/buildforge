import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  ScrollText,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
  DELETE: 'bg-rose-100 text-rose-800 border-rose-200',
  ADJUST: 'bg-amber-100 text-amber-800 border-amber-200',
  ADVANCE: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  APPROVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECT: 'bg-rose-100 text-rose-800 border-rose-200',
  CHANGE: 'bg-purple-100 text-purple-800 border-purple-200',
  TOGGLE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  // Diff Modal
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, entityType, action]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
      });
      if (search) params.append('search', search);
      if (entityType) params.append('entityType', entityType);
      if (action) params.append('action', action);

      const res = await api.get(`/admin/audit?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.totalPages);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const openDiffModal = (log) => {
    setSelectedLog(log);
    setDiffModalOpen(true);
  };

  const getActionBadgeClass = (actionName = '') => {
    for (const [key, colorClass] of Object.entries(ACTION_COLORS)) {
      if (actionName.includes(key)) return colorClass;
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable security ledger tracking every privileged modification and administrative action
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action name or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Entity Type Filter */}
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="">All Entities</option>
              <option value="Product">Product</option>
              <option value="Inventory">Inventory</option>
              <option value="Order">Order</option>
              <option value="Return">Return</option>
              <option value="User">User</option>
              <option value="Review">Review</option>
              <option value="ProductQuestion">ProductQuestion</option>
              <option value="ProductAnswer">ProductAnswer</option>
              <option value="Coupon">Coupon</option>
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

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4 text-right">Audit Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <p className="font-bold text-slate-900">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{log.actor?.name || 'Admin User'}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                        {log.actor?.email || log.actorId}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Entity Type */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.entityType}
                      </span>
                    </td>

                    {/* Entity ID */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {log.entityId ? `#${log.entityId.slice(0, 10)}...` : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openDiffModal(log)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Diff</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{logs.length}</span> of{' '}
            <span className="font-bold text-slate-800">{total}</span> events
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

      {/* Diff Inspection Modal */}
      {diffModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getActionBadgeClass(
                      selectedLog.action
                    )}`}
                  >
                    {selectedLog.action}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {selectedLog.entityType} ID: {selectedLog.entityId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Actor: <span className="font-bold text-slate-800">{selectedLog.actor?.name || selectedLog.actor?.email || selectedLog.actorId}</span> &bull;{' '}
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setDiffModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before State */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                    State Before Change
                  </span>
                  <div className="bg-slate-900 text-rose-200 p-3 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60">
                    <pre>
                      {selectedLog.before
                        ? JSON.stringify(selectedLog.before, null, 2)
                        : 'null (Created new entity)'}
                    </pre>
                  </div>
                </div>

                {/* After State */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                    State After Change
                  </span>
                  <div className="bg-slate-900 text-emerald-200 p-3 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60">
                    <pre>
                      {selectedLog.after
                        ? JSON.stringify(selectedLog.after, null, 2)
                        : 'null (Entity deleted)'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDiffModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
