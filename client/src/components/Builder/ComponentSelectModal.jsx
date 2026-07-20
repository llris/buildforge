import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

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
          setProducts(res.data.data);
        } catch (err) {
          console.error('Failed to load components', err);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
      setSearchQuery(''); // Reset search when opened
    }
  }, [isOpen, type]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lowerQ = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQ) || 
      p.brand.toLowerCase().includes(lowerQ)
    );
  }, [products, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 bg-white">
          <h2 className="text-xl font-bold text-gray-900 capitalize">Select {type}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <input 
            type="text" 
            placeholder="Search by name or brand..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No products found for this category or search.</div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-400">
                  <div className="h-20 w-20 flex-shrink-0 bg-white rounded-md border border-gray-200 p-2">
                    <img 
                      src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Img'} 
                      alt={product.name} 
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase text-gray-500">{product.brand}</p>
                      <Link 
                        to={`/products/${product.slug}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View details
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{product.name}</h3>
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      ${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
                    </p>
                  </div>
                  <button 
                    onClick={() => onSelect(product)}
                    className="rounded-md bg-blue-50 px-6 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
