import { useState, useEffect } from 'react';

// Common spec fields per category (simplified for demo)
const SPEC_FACETS = {
  cpu: [
    { key: 'socket', label: 'Socket', options: ['AM4', 'AM5', 'LGA1700'] },
    { key: 'coreCount', label: 'Core Count', options: ['4', '6', '8', '12', '16', '24'] }
  ],
  motherboard: [
    { key: 'socket', label: 'Socket', options: ['AM4', 'AM5', 'LGA1700'] },
    { key: 'formFactor', label: 'Form Factor', options: ['ATX', 'Micro ATX', 'Mini ITX'] },
    { key: 'memoryType', label: 'Memory Type', options: ['DDR4', 'DDR5'] }
  ],
  gpu: [
    { key: 'vramGb', label: 'VRAM (GB)', options: ['8', '12', '16', '24'] }
  ],
  memory: [
    { key: 'memoryType', label: 'Type', options: ['DDR4', 'DDR5'] },
    { key: 'modules', label: 'Modules', options: ['2', '4'] }
  ]
};

export default function FilterSidebar({ categories, filters, onFilterChange, currentCategory }) {
  const [localPrice, setLocalPrice] = useState({ 
    min: filters.minPrice || '', 
    max: filters.maxPrice || '' 
  });

  const handlePriceApply = () => {
    onFilterChange({
      minPrice: localPrice.min || undefined,
      maxPrice: localPrice.max || undefined
    });
  };

  const handleSpecChange = (key, val) => {
    const specs = filters.specs ? JSON.parse(filters.specs) : {};
    if (specs[key] === val) {
      delete specs[key];
    } else {
      specs[key] = val;
    }
    onFilterChange({ specs: Object.keys(specs).length ? JSON.stringify(specs) : undefined });
  };

  const currentSpecs = filters.specs ? JSON.parse(filters.specs) : {};
  const activeFacets = currentCategory ? SPEC_FACETS[currentCategory] || [] : [];

  return (
    <div className="w-full space-y-8 rounded-xl bg-card p-6 border border-border">
      
      {/* Category */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Category</h3>
        <div className="space-y-2">
          <button 
            className={`block text-sm ${!filters.category ? 'font-medium text-primary' : 'text-foreground hover:text-primary'}`}
            onClick={() => onFilterChange({ category: undefined, specs: undefined })}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button 
              key={cat.slug}
              className={`block text-sm ${filters.category === cat.slug ? 'font-medium text-primary' : 'text-foreground hover:text-primary'}`}
              onClick={() => onFilterChange({ category: cat.slug, specs: undefined })}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock Toggle */}
      <div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filters.inStock === 'true'}
            onChange={(e) => onFilterChange({ inStock: e.target.checked ? 'true' : undefined })}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-foreground">In Stock Only</span>
        </label>
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localPrice.min}
            onChange={(e) => setLocalPrice({ ...localPrice, min: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            placeholder="Max"
            value={localPrice.max}
            onChange={(e) => setLocalPrice({ ...localPrice, max: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button 
            onClick={handlePriceApply}
            className="rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            GO
          </button>
        </div>
      </div>

      {/* Dynamic Spec Facets */}
      {activeFacets.map(facet => (
        <div key={facet.key}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{facet.label}</h3>
          <div className="space-y-2">
            {facet.options.map(opt => {
              // Note: strictly we might need to handle numbers correctly based on type, but keeping simple
              const val = isNaN(opt) ? opt : Number(opt); 
              return (
                <label key={opt} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentSpecs[facet.key] === val}
                    onChange={() => handleSpecChange(facet.key, val)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
