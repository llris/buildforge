import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/Product/ProductCard';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [catsRes, topRes, newRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?sort=rating&limit=4'),
          api.get('/products?sort=newest&limit=4')
        ]);
        
        setCategories(catsRes.data.data || []);
        setTopRated(topRes.data.data.items || []);
        setNewArrivals(newRes.data.data.items || []);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative h-[500px] w-full overflow-hidden bg-zinc-900 rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Gaming PC Setup" 
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="relative z-20 flex h-full max-w-7xl flex-col justify-center px-6 lg:px-8 mx-auto">
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Build Your Ultimate <span className="text-primary">Dream Rig</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-300">
            Premium components, expert reviews, and powerful tools to plan and track your perfect PC build.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/products" className="rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground shadow transition hover:bg-primary/90">
              Shop Components
            </Link>
            <Link to="/builds/new" className="rounded-md bg-secondary px-6 py-3 font-semibold text-secondary-foreground shadow transition hover:bg-secondary/80">
              Start a Build
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold text-foreground">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              to={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 shadow-sm border border-border transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Rated Rail */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">Top Rated Components</h2>
          <Link to="/products?sort=rating" className="text-sm font-medium text-primary hover:underline">
            View All &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {topRated.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onCompareToggle={() => {}} 
              isCompared={false} 
              hideCompare={true}
            />
          ))}
        </div>
      </section>

      {/* New Arrivals Rail */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">New Arrivals</h2>
          <Link to="/products?sort=newest" className="text-sm font-medium text-primary hover:underline">
            View All &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {newArrivals.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onCompareToggle={() => {}} 
              isCompared={false} 
              hideCompare={true}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
