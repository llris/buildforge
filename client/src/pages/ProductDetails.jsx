import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, Check, Zap } from 'lucide-react';
import api from '../api/axios';
import SpecTable from '../components/Product/SpecTable';
import ReviewSection from '../components/Product/ReviewSection';
import QASection from '../components/Product/QASection';
import ProductCard from '../components/Product/ProductCard';
import SEO from '../components/Common/SEO';
import { formatProductTitle, optimizeImageUrl, formatINR } from '../utils/productUtils';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

export default function ProductDetails() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const initialTab = searchParams.get('tab') || 'description';
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <p className="mt-2 text-sm text-gray-500">The product you are looking for might have been retired or does not exist.</p>
        <Link to="/products" className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const stock = product.inventory?.stockQty || 0;
  const reserved = product.inventory?.reservedQty || 0;
  const availableStock = Math.max(0, stock - reserved);
  const isOutOfStock = availableStock <= 0;
  const images = product.images?.length > 0 ? product.images : ['https://placehold.co/800x800?text=No+Image'];
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setAddingToCart(true);
    await addToCart(product, qty);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    setAddingToCart(true);
    const res = await addToCart(product, qty);
    setAddingToCart(false);
    if (res.success) {
      navigate('/cart');
    }
  };

  const cleanTitle = formatProductTitle(product);
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cleanTitle,
    image: images,
    description: `Buy ${cleanTitle} by ${product.brand} online on BuildForge. Genuine hardware with 2-year warranty and verified PC compatibility.`,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      price: product.discountPrice || product.price,
      priceCurrency: 'INR',
      availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
    ...(product.avgRating && product.ratingCount ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avgRating,
        reviewCount: product.ratingCount,
      }
    } : {})
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      <SEO
        title={cleanTitle}
        description={`Buy ${cleanTitle} by ${product.brand} on BuildForge. Check real-time PC compatibility, specs, reviews, and benchmark rankings.`}
        image={images[0]}
        jsonLd={jsonLdData}
      />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
        <Link to="/products" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Catalog
        </Link>
        <span>/</span>
        <span className="text-gray-600 uppercase">{product.category?.name || product.brand}</span>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{cleanTitle}</span>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl bg-gray-50 p-8 border border-gray-200 flex items-center justify-center relative shadow-sm">
            <img
              src={optimizeImageUrl(images[activeImage])}
              alt={cleanTitle}
              className="max-h-full max-w-full object-contain"
            />
            {product.discountPrice && (
              <div className="absolute top-4 left-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                SALE
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 p-1.5 transition ${
                    activeImage === idx ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={optimizeImageUrl(img)} alt={`Thumbnail ${idx}`} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            {product.brand}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight sm:text-4xl">
            {cleanTitle}
          </h1>

          {/* Rating */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(product.avgRating || 0)
                      ? 'fill-current'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-bold text-gray-800">
              {(product.avgRating || 0).toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">({product.ratingCount || 0} reviews)</span>
          </div>

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-4">
            {product.discountPrice ? (
              <>
                <span className="text-4xl font-extrabold text-gray-900">
                  {formatINR(product.discountPrice)}
                </span>
                <span className="text-xl font-medium text-gray-400 line-through">
                  {formatINR(product.price)}
                </span>
              </>
            ) : (
              <span className="text-4xl font-extrabold text-gray-900">
                {formatINR(product.price)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isOutOfStock
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOutOfStock ? 'bg-red-600' : 'bg-emerald-600'
                }`}
              ></span>
              {isOutOfStock ? 'Out of Stock' : `In Stock (${availableStock} available)`}
            </span>
          </div>

          <p className="mt-6 text-sm text-gray-600 leading-relaxed">
            Upgrade your custom build with the high-performance {cleanTitle} from {product.brand}. Built with premium materials and rigorous quality testing for gaming and professional workstations.
          </p>

          <hr className="my-8 border-gray-200" />

          {/* Actions */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {/* Stepper */}
              <div className="flex h-12 w-32 items-center justify-between rounded-xl border border-gray-300 bg-gray-50 px-3 shadow-inner">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="text-gray-500 hover:text-gray-900 text-xl font-bold px-1 transition"
                  disabled={isOutOfStock || qty <= 1}
                >
                  &minus;
                </button>
                <span className="font-bold text-gray-900 text-base">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(availableStock, qty + 1))}
                  className="text-gray-500 hover:text-gray-900 text-xl font-bold px-1 transition"
                  disabled={isOutOfStock || qty >= availableStock}
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
                className="flex-1 rounded-xl bg-blue-600 h-12 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
              </button>
            </div>

            <div className="flex gap-4">
              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`flex-1 rounded-xl h-12 font-semibold text-sm border shadow-sm transition flex items-center justify-center gap-2 ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-rose-600'
                }`}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>

              {/* Buy it Now */}
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock || addingToCart}
                className="flex-1 rounded-xl bg-gray-900 h-12 font-bold text-sm text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Buy it Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['description', 'specifications', 'reviews', 'q&a'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold capitalize transition ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose max-w-none text-gray-600 text-sm leading-relaxed space-y-4">
              <p>
                Experience unmatched stability and speed with the {product.name}. Designed for PC builders, gamers, and content creators looking for dependable performance.
              </p>
              <p>
                Engineered with high efficiency in mind, this part seamlessly integrates with compatible cases, motherboards, and cooling configurations.
              </p>
            </div>
          )}
          {activeTab === 'specifications' && <SpecTable specs={product.specs} />}
          {activeTab === 'reviews' && <ReviewSection productId={product.id} />}
          {activeTab === 'q&a' && <QASection productId={product.id} />}
        </div>
      </div>

      {/* Related Products */}
      {product.relatedProducts?.length > 0 && (
        <section className="border-t border-gray-200 pt-12">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">Related Products</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {product.relatedProducts.map((p) => (
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
