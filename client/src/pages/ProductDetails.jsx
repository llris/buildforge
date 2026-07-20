import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import SpecTable from '../components/Product/SpecTable';
import ReviewSection from '../components/Product/ReviewSection';
import ProductCard from '../components/Product/ProductCard';

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data.data);
        setQty(1); // Reset quantity on product change
        setActiveImage(0); // Reset image on product change
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-foreground">Product not found</h2>
        <Link to="/products" className="mt-4 text-primary hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const stock = product.inventory?.stockQty || 0;
  const isOutOfStock = stock <= 0;
  const images = product.images?.length > 0 ? product.images : ['https://placehold.co/800x800?text=No+Image'];

  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 py-8 space-y-16">
      
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-xl bg-muted/20 p-8 border border-border flex items-center justify-center relative">
             <img 
               src={images[activeImage]} 
               alt={product.name} 
               className="h-full w-full object-contain"
             />
             {product.discountPrice && (
               <div className="absolute top-4 left-4 rounded-full bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground shadow-sm">
                 SALE
               </div>
             )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 bg-muted/20 ${activeImage === idx ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="h-full w-full object-contain p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </div>
          <h1 className="text-3xl font-bold text-foreground leading-tight sm:text-4xl">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`h-5 w-5 ${i < Math.round(product.avgRating) ? 'fill-current' : 'fill-muted text-muted'}`} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">{product.avgRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({product.ratingCount} reviews)</span>
          </div>

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-4">
            {product.discountPrice ? (
              <>
                <span className="text-4xl font-extrabold text-foreground">
                  ${product.discountPrice.toFixed(2)}
                </span>
                <span className="text-xl font-medium text-muted-foreground line-through">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-4xl font-extrabold text-foreground">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${isOutOfStock ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? 'bg-destructive' : 'bg-green-600'}`}></span>
              {isOutOfStock ? 'Out of Stock' : `In Stock (${stock} available)`}
            </span>
          </div>

          <p className="mt-6 text-base text-muted-foreground leading-relaxed">
            Upgrade your rig with the high-performance {product.name} from {product.brand}. Designed for enthusiasts looking for extreme speed and reliability.
          </p>

          <hr className="my-8 border-border" />

          {/* Actions */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-32 items-center justify-between rounded-md border border-input bg-background px-3">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="text-muted-foreground hover:text-foreground text-xl"
                  disabled={isOutOfStock}
                >
                  &minus;
                </button>
                <span className="font-semibold">{qty}</span>
                <button 
                  onClick={() => setQty(Math.min(stock, qty + 1))}
                  className="text-muted-foreground hover:text-foreground text-xl"
                  disabled={isOutOfStock}
                >
                  +
                </button>
              </div>
              <button 
                disabled={isOutOfStock}
                className="flex-1 rounded-md bg-primary h-12 font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
              >
                Add to Cart
              </button>
            </div>
            
            <div className="flex gap-4">
              <button className="flex-1 rounded-md bg-secondary h-12 font-semibold text-secondary-foreground shadow transition hover:bg-secondary/80 flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Add to Wishlist
              </button>
              <button 
                className="flex-1 rounded-md bg-transparent border-2 border-primary h-12 font-semibold text-primary transition hover:bg-primary/5"
              >
                Buy it Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['description', 'specifications', 'reviews', 'q&a'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground">
              <p>Experience unmatched performance with the {product.name}. Carefully engineered to deliver top-tier speed and thermal efficiency, this component is perfect for both casual builders and extreme overclockers.</p>
              <p>Please refer to the specifications tab for detailed technical data.</p>
            </div>
          )}
          {activeTab === 'specifications' && (
            <SpecTable specs={product.specs} />
          )}
          {activeTab === 'reviews' && (
            <ReviewSection reviews={product.reviews} />
          )}
          {activeTab === 'q&a' && (
            <div className="text-muted-foreground">No questions have been asked yet. Be the first!</div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {product.relatedProducts?.length > 0 && (
        <section>
          <h2 className="mb-8 text-2xl font-bold text-foreground">Related Products</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {product.relatedProducts.map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onCompareToggle={() => {}} 
                isCompared={false} 
                hideCompare={true}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
