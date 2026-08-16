import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../api/axios';
import ComponentSelectModal from '../components/Builder/ComponentSelectModal';
import { Link, useNavigate } from 'react-router-dom';

const COMPONENT_SLOTS = [
  { key: 'cpu', label: 'CPU' },
  { key: 'cooler', label: 'CPU Cooler' },
  { key: 'motherboard', label: 'Motherboard' },
  { key: 'ram', label: 'Memory (RAM)', isArray: true },
  { key: 'gpu', label: 'Video Card (GPU)' },
  { key: 'storage', label: 'Storage', isArray: true },
  { key: 'case', label: 'Case' },
  { key: 'psu', label: 'Power Supply' }
];

export default function PCBuilder() {
  const { user } = useAuth();
  const { addToCart, showToast } = useCart();
  const navigate = useNavigate();
  
  const [buildIds, setBuildIds] = useState({
    cpu: null,
    cooler: null,
    motherboard: null,
    ram: [],
    gpu: null,
    storage: [],
    case: null,
    psu: null
  });

  const [targetResolution, setTargetResolution] = useState('1440p');

  const [validationResult, setValidationResult] = useState(null);
  const [populatedBuild, setPopulatedBuild] = useState({});
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [showAutoBuildModal, setShowAutoBuildModal] = useState(false);
  const [autoBuildParams, setAutoBuildParams] = useState({ budget: 1000, useCase: 'gaming', resolution: '1440p' });
  const [isAutoBuilding, setIsAutoBuilding] = useState(false);

  useEffect(() => {
    const validate = async () => {
      setLoading(true);
      try {
        const res = await api.post('/builder/validate', { ...buildIds, resolution: targetResolution });
        setValidationResult(res.data.data.validation);
        setPopulatedBuild(res.data.data.populatedBuild);
      } catch (err) {
        console.error('Validation failed', err);
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [buildIds, targetResolution]);

  const openModal = (slot) => {
    setActiveSlot(slot);
    setModalOpen(true);
  };

  const handleSelect = (product) => {
    if (activeSlot.isArray) {
      setBuildIds(prev => ({
        ...prev,
        [activeSlot.key]: [...prev[activeSlot.key], product.id]
      }));
    } else {
      setBuildIds(prev => ({
        ...prev,
        [activeSlot.key]: product.id
      }));
    }
    setModalOpen(false);
  };

  const handleRemove = (key, idToRemove) => {
    const isArray = COMPONENT_SLOTS.find(s => s.key === key)?.isArray;
    if (isArray) {
      setBuildIds(prev => ({
        ...prev,
        [key]: prev[key].filter(id => id !== idToRemove)
      }));
    } else {
      setBuildIds(prev => ({
        ...prev,
        [key]: null
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in to save a build.');
    if (!saveName) return alert('Please provide a name.');
    
    setIsSaving(true);
    try {
      await api.post('/builds', {
        name: saveName,
        components: buildIds,
        totalPrice: validationResult.totalPrice,
        buildScore: validationResult.buildScore
      });
      alert('Build saved successfully!');
      setShowSaveModal(false);
    } catch (err) {
      alert('Failed to save build');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoBuild = async (e) => {
    e.preventDefault();
    setIsAutoBuilding(true);
    try {
      const res = await api.post('/builder/auto-build', autoBuildParams);
      const b = res.data.data.populatedBuild;
      setTargetResolution(autoBuildParams.resolution);
      setBuildIds({
        cpu: b.cpu?.id || null,
        cooler: b.cooler?.id || null,
        motherboard: b.motherboard?.id || null,
        ram: b.ram?.map(r => r.id) || [],
        gpu: b.gpu?.id || null,
        storage: b.storage?.map(s => s.id) || [],
        case: b.case?.id || null,
        psu: b.psu?.id || null
      });
      setShowAutoBuildModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to generate auto-build');
    } finally {
      setIsAutoBuilding(false);
    }
  };

  const handleApplySuggestion = (suggestion) => {
    if (suggestion.action.includes('Select')) {
      const slot = COMPONENT_SLOTS.find(s => s.key === suggestion.targetComponent);
      if (slot) openModal(slot);
      return;
    }

    if (suggestion.replacementProductId) {
      const isArray = COMPONENT_SLOTS.find(s => s.key === suggestion.targetComponent)?.isArray;
      setBuildIds(prev => ({
        ...prev,
        [suggestion.targetComponent]: isArray ? [suggestion.replacementProductId] : suggestion.replacementProductId
      }));
    }
  };

  const handleAddAllToCart = async () => {
    const productsToAdd = [];
    COMPONENT_SLOTS.forEach(slot => {
      const items = slot.isArray ? (populatedBuild[slot.key] || []) : (populatedBuild[slot.key] ? [populatedBuild[slot.key]] : []);
      items.forEach(p => {
        if (p && p.id) productsToAdd.push(p);
      });
    });

    if (productsToAdd.length === 0) {
      alert('Please select at least one component before adding to cart.');
      return;
    }

    for (const p of productsToAdd) {
      await addToCart(p, 1);
    }
    navigate('/cart');
  };

  const renderProductSlot = (product, key, isArray = false) => {
    return (
      <div className="flex items-center gap-6 rounded-lg border border-border bg-card p-4 shadow-sm mb-2">
        <Link to={`/products/${product.slug}`} className="h-16 w-16 flex-shrink-0 bg-white rounded-md border border-border p-1">
          <img 
            src={product.images?.[0] || 'https://placehold.co/100x100?text=No+Img'} 
            alt={product.name} 
            className="h-full w-full object-contain hover:scale-105 transition"
          />
        </Link>
        <div className="flex-1">
          <Link to={`/products/${product.slug}`} className="text-sm font-bold text-foreground hover:text-primary">
            {product.brand} {product.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {Object.entries(product.specs || {})
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : v}`)
              .slice(0, 3)
              .join(' | ')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">
            ${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
          </p>
        </div>
        <button 
          onClick={() => handleRemove(key, product.id)}
          className="text-muted-foreground hover:text-destructive p-2"
          title="Remove component"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Build Advisor</h1>
          <p className="mt-2 text-sm text-muted-foreground">Select components or start from a budget build to get proactive suggestions.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowAutoBuildModal(true)}
            className="rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20"
          >
            Start from a Budget Build
          </button>
          <button 
            onClick={() => setBuildIds({cpu: null, cooler: null, motherboard: null, ram: [], gpu: null, storage: [], case: null, psu: null})}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Clear Build
          </button>
          <button 
            onClick={() => user ? setShowSaveModal(true) : alert('Please log in to save a build.')}
            className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90"
          >
            Save Build
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left: Component Slots */}
        <div className="flex-1 space-y-6">
          <div className="rounded-xl border border-border bg-muted/10 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 font-semibold text-foreground w-40">Component</th>
                  <th className="px-6 py-4 font-semibold text-foreground">Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPONENT_SLOTS.map((slot) => {
                  const items = slot.isArray 
                    ? (populatedBuild[slot.key] || []) 
                    : (populatedBuild[slot.key] ? [populatedBuild[slot.key]] : []);
                  
                  return (
                    <tr key={slot.key} className="bg-background">
                      <td className="px-6 py-6 align-top">
                        <span className="font-medium text-muted-foreground">{slot.label}</span>
                      </td>
                      <td className="px-6 py-6">
                        {items.length > 0 ? (
                          <>
                            {items.map(product => (
                              <div key={product.id}>
                                {renderProductSlot(product, slot.key, slot.isArray)}
                              </div>
                            ))}
                            {slot.isArray && (
                              <button 
                                onClick={() => openModal(slot)}
                                className="mt-2 rounded-md bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
                              >
                                + Add another {slot.label}
                              </button>
                            )}
                          </>
                        ) : (
                          <button 
                            onClick={() => openModal(slot)}
                            className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/5 p-6 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition"
                          >
                            + Choose A {slot.label}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Status Sidebar */}
        <div className="w-full lg:w-96 shrink-0 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-md sticky top-6">
            
            {/* Price */}
            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Total</p>
              <p className="text-4xl font-extrabold text-foreground">
                ${validationResult?.totalPrice ? validationResult.totalPrice.toFixed(2) : '0.00'}
              </p>
            </div>

            {/* Performance & Analysis Panel */}
            <div className="mb-6 pb-6 border-b border-border space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-foreground">Performance & Analysis</h3>
                <select 
                  value={targetResolution} 
                  onChange={e => setTargetResolution(e.target.value)}
                  className="rounded border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="1080p">1080p</option>
                  <option value="1440p">1440p</option>
                  <option value="4K">4K</option>
                </select>
              </div>

              {/* Power Visualizer */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Est. Wattage</span>
                  <span className="font-bold">{validationResult?.estimatedWattage || 0}W</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Target PSU</span>
                  <span className="font-bold">{validationResult?.recommendedWattage || 0}W</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-full ${validationResult?.errors?.some(e => e.code === 'INSUFFICIENT_WATTAGE') ? 'bg-destructive' : 'bg-primary'}`} 
                    style={{ width: `${Math.min(100, ((validationResult?.estimatedWattage || 0) / (populatedBuild?.psu?.specs?.wattage || 1000)) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* Bottleneck Indicator */}
              {validationResult?.bottleneck && (
                <div className="mt-4 text-sm">
                  <p className="text-muted-foreground mb-1">Bottleneck Status</p>
                  <div className={`p-3 rounded-md ${validationResult.bottleneck.component === 'none' ? 'bg-green-500/10 text-green-700' : 'bg-yellow-500/10 text-yellow-700'}`}>
                    {validationResult.bottleneck.message}
                  </div>
                </div>
              )}

              {/* FPS Estimate */}
              {validationResult?.performanceEstimate && (
                <div className="mt-4 text-sm">
                  <p className="text-muted-foreground mb-1">Est. Gaming Performance ({validationResult.performanceEstimate.resolution}) <span className="text-[10px] uppercase ml-1 px-1.5 py-0.5 bg-muted rounded">Estimate</span></p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 border border-border rounded-md text-center bg-card">
                      <span className="block text-xs text-muted-foreground">E-Sports</span>
                      <span className="font-bold text-foreground">{validationResult.performanceEstimate.esports}</span>
                    </div>
                    <div className="p-2 border border-border rounded-md text-center bg-card">
                      <span className="block text-xs text-muted-foreground">AAA Titles</span>
                      <span className="font-bold text-foreground">{validationResult.performanceEstimate.aaa}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Validation & Suggestions Panel */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Build Status</h3>
              
              {!validationResult && !loading && (
                 <div className="rounded-md bg-muted/30 p-4 text-sm text-muted-foreground">
                   Select components to see compatibility.
                 </div>
              )}
              {loading && (
                 <div className="text-sm text-muted-foreground animate-pulse">Running validation...</div>
              )}
              {validationResult?.valid && (
                 <div className="rounded-md bg-green-500/10 p-4 text-sm font-medium text-green-600 flex items-start gap-3">
                   <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                   No compatibility issues found.
                 </div>
              )}

              {/* Suggestions */}
              {validationResult?.suggestions?.map((s, i) => (
                <div key={`sug-${i}`} className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 shrink-0 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div className="text-foreground font-medium">{s.message}</div>
                  </div>
                  <button 
                    onClick={() => handleApplySuggestion(s)}
                    className="self-end px-3 py-1.5 text-xs font-bold text-primary-foreground bg-primary rounded hover:bg-primary/90 transition"
                  >
                    {s.action}
                  </button>
                </div>
              ))}
              
              {/* Errors */}
              {validationResult?.errors.map((err, i) => (
                <div key={`err-${i}`} className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="font-bold block">{err.code}</span>
                    {err.humanMessage}
                  </div>
                </div>
              ))}

              {/* Warnings */}
              {validationResult?.warnings.map((warn, i) => (
                <div key={`warn-${i}`} className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-700 flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {warn.humanMessage}
                </div>
              ))}

              {/* Info */}
              {validationResult?.info.map((info, i) => (
                <div key={`info-${i}`} className="rounded-md border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-700 flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {info.humanMessage}
                </div>
              ))}
            </div>

            <button
              onClick={handleAddAllToCart}
              className="mt-8 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add All to Cart</span>
            </button>
          </div>
        </div>
      </div>

      <ComponentSelectModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        type={activeSlot?.key}
        onSelect={handleSelect}
      />

      {/* Auto-Build Modal */}
      {showAutoBuildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Start from a Budget Build</h2>
            <form onSubmit={handleAutoBuild}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Budget ($)</label>
                  <input 
                    type="number" min="500" max="5000" step="50"
                    value={autoBuildParams.budget} 
                    onChange={(e) => setAutoBuildParams({...autoBuildParams, budget: Number(e.target.value)})} 
                    required 
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Use Case</label>
                  <select 
                    value={autoBuildParams.useCase} 
                    onChange={(e) => setAutoBuildParams({...autoBuildParams, useCase: e.target.value})}
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                  >
                    <option value="gaming">Gaming</option>
                    <option value="workstation">Workstation / Productivity</option>
                    <option value="office">Office / Basic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Resolution</label>
                  <select 
                    value={autoBuildParams.resolution} 
                    onChange={(e) => setAutoBuildParams({...autoBuildParams, resolution: e.target.value})}
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                  >
                    <option value="1080p">1080p</option>
                    <option value="1440p">1440p</option>
                    <option value="4K">4K</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowAutoBuildModal(false)}
                  className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isAutoBuilding}
                  className="flex-1 rounded-md bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAutoBuilding ? 'Building...' : 'Auto-Build'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Save Build</h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Build Name</label>
                <input 
                  type="text" 
                  value={saveName} 
                  onChange={(e) => setSaveName(e.target.value)} 
                  required 
                  className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                  placeholder="e.g. Dream Gaming Rig"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 rounded-md bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
