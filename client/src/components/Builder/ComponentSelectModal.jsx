import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { X, Search, ExternalLink, Check } from 'lucide-react';
import { formatProductTitle, optimizeImageUrl, formatINR } from '../../utils/productUtils';

export default function ComponentSelectModal({ type, isOpen, onClose, onSelect }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && type) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/builder/components/${type}`);
          setProducts(res.data?.data || []);
        } catch (err) {
          console.error('Failed to load components', err);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
      setSearchQuery('');
    }
  }, [isOpen, type]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lowerQ = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name?.toLowerCase().includes(lowerQ) || 
      p.brand?.toLowerCase().includes(lowerQ)
    );
  }, [products, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-800 p-6 bg-gray-900">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">Select {type}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Choose a compatible component for your system configuration</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-gray-800 p-4 bg-gray-900/90">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={`Search ${type} by name or brand...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <p className="text-base font-semibold">No hardware found for &quot;{type}&quot;</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your search query</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map(product => {
                const cleanTitle = formatProductTitle(product);
                const displayPrice = product.discountPrice ? formatINR(product.discountPrice) : formatINR(product.price);

                return (
                  <div key={product.id} className="flex items-center gap-4 sm:gap-6 rounded-xl border border-gray-800 bg-gray-900/90 p-4 shadow-sm hover:border-blue-500/50 transition">
                    <div className="h-20 w-20 flex-shrink-0 bg-gray-950 rounded-lg border border-gray-800 p-2 flex items-center justify-center">
                      <img 
                        src={optimizeImageUrl(product.images?.[0])} 
                        alt={cleanTitle} 
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {product.brand}
                        </span>
                        <Link 
                          to={`/products/${product.slug}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-blue-400 flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white truncate mt-1">{cleanTitle}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {Object.entries(product.specs || {})
                          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : v}`)
                          .slice(0, 3)
                          .join(' | ')}
                      </p>
                      <p className="text-sm font-extrabold text-white mt-1">
                        {displayPrice}
                      </p>
                    </div>
                    <button 
                      onClick={() => onSelect(product)}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-500 transition shadow-md flex items-center gap-1.5 shrink-0 focus-visible:ring-2 focus-visible:ring-blue-400 focus:outline-none"
                    >
                      <Check className="w-4 h-4" />
                      <span>Select</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
