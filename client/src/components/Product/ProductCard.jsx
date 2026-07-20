import { Link } from 'react-router-dom';

export default function ProductCard({ product, onCompareToggle, isCompared, hideCompare }) {
  const stock = product.inventory?.stockQty || 0;
  const isOutOfStock = stock <= 0;

  return (
    <div className="product-card group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/50">
      <Link to={`/products/${product.slug}`} className="absolute inset-0 z-10" />
      
      {/* Badges */}
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
        {product.discountPrice && (
          <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground">
            Sale
          </span>
        )}
        {isOutOfStock && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            Out of Stock
          </span>
        )}
      </div>

      {/* Compare Checkbox */}
      {!hideCompare && (
        <div className="absolute right-3 top-3 z-20">
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-background/80 px-2 py-1 backdrop-blur-sm transition-colors hover:bg-background">
            <input
              type="checkbox"
              checked={isCompared}
              onChange={(e) => onCompareToggle(product, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs font-medium">Compare</span>
          </label>
        </div>
      )}

      {/* Image */}
      <div className="aspect-square overflow-hidden bg-muted/20 p-6">
        <img
          src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          {product.brand}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground sm:text-base">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-4 w-4 ${i < Math.round(product.avgRating) ? 'fill-current' : 'fill-muted text-muted'}`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({product.ratingCount})</span>
        </div>

        {/* Price & Actions */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            {product.discountPrice ? (
              <>
                <span className="text-lg font-bold text-foreground">
                  ${product.discountPrice.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-foreground">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="relative z-20 flex gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button 
              disabled={isOutOfStock}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
