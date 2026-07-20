import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/Product/ProductCard';
import FilterSidebar from '../components/Product/FilterSidebar';

export default function ProductCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [compareList, setCompareList] = useState([]);

  // Extract filters from URL
  const filters = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    inStock: searchParams.get('inStock') || undefined,
    specs: searchParams.get('specs') || undefined,
    sort: searchParams.get('sort') || undefined,
    page: searchParams.get('page') || '1',
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Remove undefined values to build query
        const queryParams = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v != null)
        );
        const q = new URLSearchParams(queryParams).toString();
        
        const res = await api.get(`/products?${q}`);
        setProducts(res.data.data.items || []);
        setMeta(res.data.data.meta);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  const handleFilterChange = (newFilters) => {
    const updated = { ...filters, ...newFilters, page: '1' }; // reset page on filter change
    
    // Clean up undefined
    Object.keys(updated).forEach(key => {
      if (updated[key] === undefined || updated[key] === '') {
        delete updated[key];
      }
    });

    setSearchParams(updated);
  };

  const handleCompareToggle = (product, isChecked) => {
    if (isChecked) {
      if (compareList.length < 4) {
        setCompareList([...compareList, product]);
      } else {
        alert('You can only compare up to 4 products.');
      }
    } else {
      setCompareList(compareList.filter(p => p.id !== product.id));
    }
  };

  const handleCompareSubmit = () => {
    if (compareList.length > 0) {
      const ids = compareList.map(p => p.id).join(',');
      navigate(`/compare?ids=${ids}`);
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 py-8">
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <FilterSidebar 
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            currentCategory={filters.category}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {filters.category ? categories.find(c => c.slug === filters.category)?.name || 'Products' : 'All Products'}
              </h1>
              {meta && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {products.length} of {meta.totalItems} results
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {compareList.length > 0 && (
                <button 
                  onClick={handleCompareSubmit}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Compare ({compareList.length})
                </button>
              )}
              <select
                value={filters.sort || ''}
                onChange={(e) => handleFilterChange({ sort: e.target.value })}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sort by: Featured</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
             <div className="flex h-64 items-center justify-center">
               <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
             </div>
          ) : products.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center">
               <h3 className="text-lg font-medium text-foreground">No products found</h3>
               <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or search criteria.</p>
               <button 
                 onClick={() => setSearchParams({})}
                 className="mt-4 text-primary hover:underline"
               >
                 Clear all filters
               </button>
             </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map(product => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onCompareToggle={handleCompareToggle}
                    isCompared={compareList.some(p => p.id === product.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  <button 
                    disabled={meta.currentPage === 1}
                    onClick={() => handleFilterChange({ page: (meta.currentPage - 1).toString() })}
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Page {meta.currentPage} of {meta.totalPages}
                  </span>
                  <button 
                    disabled={meta.currentPage === meta.totalPages}
                    onClick={() => handleFilterChange({ page: (meta.currentPage + 1).toString() })}
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>

      {/* Floating Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {compareList.map(p => (
                  <div key={p.id} className="h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-white">
                    <img src={p.images?.[0] || 'https://placehold.co/100x100?text=No+Img'} alt={p.name} className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{compareList.length} product(s) selected</p>
                <button 
                  onClick={() => setCompareList([])}
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  Clear all
                </button>
              </div>
            </div>
            <button 
              onClick={handleCompareSubmit}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Compare Selected
            </button>
          </div>
        </div>
      )}
    </>
  );
}
