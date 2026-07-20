import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ComparisonPage() {
  const [searchParams] = useSearchParams();
  const idsStr = searchParams.get('ids');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompare = async () => {
      if (!idsStr) {
        setLoading(false);
        return;
      }
      const productIds = idsStr.split(',').filter(id => id);
      if (productIds.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await api.post('/products/compare', { productIds });
        setProducts(res.data.data);
      } catch (err) {
        console.error('Failed to load comparison data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompare();
  }, [idsStr]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-foreground">No Products to Compare</h2>
        <Link to="/products" className="mt-4 text-primary hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Extract all unique spec keys across all products
  const allSpecKeys = new Set();
  products.forEach(p => {
    if (p.specs) {
      Object.keys(p.specs).forEach(k => allSpecKeys.add(k));
    }
  });
  const specKeysArray = Array.from(allSpecKeys).sort();

  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const renderValue = (val) => {
    if (val === undefined || val === null) return '-';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  };

  // Determine if a spec row has differences to highlight it
  const hasDifferences = (key) => {
    const vals = products.map(p => renderValue(p.specs?.[key]));
    const first = vals[0];
    return vals.some(v => v !== first);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Compare Products</h1>
        <Link to="/products" className="text-sm font-medium text-primary hover:underline">
          &larr; Back to Catalog
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-muted/20 sticky top-0 z-10">
            <tr>
              <th className="p-6 w-48 font-semibold text-foreground align-bottom bg-muted/20 border-b border-border shadow-sm">
                Product Features
              </th>
              {products.map(p => (
                <th key={p.id} className="p-6 min-w-[250px] border-l border-b border-border bg-muted/20 align-top shadow-sm">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-32 w-32 mb-4 bg-background rounded-lg p-2 border border-border overflow-hidden">
                      <img 
                        src={p.images?.[0] || 'https://placehold.co/400x400?text=No+Image'} 
                        alt={p.name} 
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{p.brand}</p>
                    <Link to={`/products/${p.slug}`} className="text-sm font-bold text-foreground hover:text-primary mb-2 line-clamp-2">
                      {p.name}
                    </Link>
                    <div className="text-lg font-extrabold text-foreground mb-4">
                      ${p.discountPrice ? p.discountPrice.toFixed(2) : p.price.toFixed(2)}
                    </div>
                    <button className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                      Add to Cart
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            
            {/* General Row: Rating */}
            <tr className="bg-background">
              <th className="p-6 font-medium text-foreground bg-muted/5">Rating</th>
              {products.map(p => (
                <td key={p.id} className="p-6 border-l border-border text-center font-medium">
                  {p.avgRating.toFixed(1)} / 5.0 ({p.ratingCount})
                </td>
              ))}
            </tr>

            {/* Spec Rows */}
            {specKeysArray.map(key => {
              const diff = hasDifferences(key);
              return (
                <tr key={key} className={diff ? 'bg-primary/5' : 'bg-background'}>
                  <th className={`p-6 font-medium bg-muted/5 ${diff ? 'text-primary' : 'text-foreground'}`}>
                    {formatKey(key)}
                  </th>
                  {products.map(p => (
                    <td key={p.id} className={`p-6 border-l border-border text-center ${diff ? 'font-semibold text-foreground' : ''}`}>
                      {renderValue(p.specs?.[key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
