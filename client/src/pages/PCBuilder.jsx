import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../api/axios';
import ComponentSelectModal from '../components/Builder/ComponentSelectModal';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/Common/SEO';
import { formatProductTitle, optimizeImageUrl, formatINR } from '../utils/productUtils';
import { 
  ShoppingCart, 
  Wrench, 
  Sparkles, 
  Trash2, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Zap, 
  Save,
  RotateCcw,
  ExternalLink,
  Share2
} from 'lucide-react';

const COMPONENT_SLOTS = [
  { key: 'cpu', label: 'CPU / Processor' },
  { key: 'cooler', label: 'CPU Cooler' },
  { key: 'motherboard', label: 'Motherboard' },
  { key: 'ram', label: 'Memory (RAM)', isArray: true },
  { key: 'gpu', label: 'Graphics Card (GPU)' },
  { key: 'storage', label: 'Storage (SSD/HDD)', isArray: true },
  { key: 'case', label: 'PC Case' },
  { key: 'psu', label: 'Power Supply (PSU)' }
];

export default function PCBuilder() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [buildIds, setBuildIds] = useState(() => {
    if (location.state?.loadBuild) {
      return location.state.loadBuild;
    }
    try {
      const saved = localStorage.getItem('bf_builder_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore parse errors
    }
    return {
      cpu: null,
      cooler: null,
      motherboard: null,
      ram: [],
      gpu: null,
      storage: [],
      case: null,
      psu: null
    };
  });

  // Keep state synced if user navigated with new loadBuild in location.state
  useEffect(() => {
    if (location.state?.loadBuild) {
      setBuildIds(location.state.loadBuild);
    }
  }, [location.state]);

  // Persist current build to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bf_builder_state', JSON.stringify(buildIds));
    } catch {
      // Ignore storage errors
    }
  }, [buildIds]);

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
    let isMounted = true;
    const validate = async () => {
      setLoading(true);
      try {
        const res = await api.post('/builder/validate', { ...buildIds, resolution: targetResolution });
        if (isMounted && res.data?.data) {
          setValidationResult(res.data.data.validation);
          setPopulatedBuild(res.data.data.populatedBuild || {});
        }
      } catch (err) {
        console.error('Validation failed', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    validate();
    return () => { isMounted = false; };
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
    if (!saveName.trim()) return alert('Please provide a name.');
    
    setIsSaving(true);
    try {
      await api.post('/builds', {
        name: saveName.trim(),
        components: buildIds,
        totalPrice: validationResult?.totalPrice || 0,
        buildScore: validationResult?.buildScore || 0
      });
      alert('Build saved successfully!');
      setShowSaveModal(false);
      setSaveName('');
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
      const b = res.data?.data?.populatedBuild;
      if (b) {
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
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate auto-build');
    } finally {
      setIsAutoBuilding(false);
    }
  };

  const handleApplySuggestion = (suggestion) => {
    if (suggestion.action?.includes('Select')) {
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

  const renderProductSlot = (product, key) => {
    const cleanTitle = formatProductTitle(product);
    const displayPrice = product.discountPrice ? formatINR(product.discountPrice) : formatINR(product.price);

    return (
      <div className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800/90 p-4 shadow-sm mb-3">
        <Link to={`/products/${product.slug}`} className="h-16 w-16 flex-shrink-0 bg-gray-900 rounded-lg border border-gray-700 p-1 flex items-center justify-center">
          <img 
            src={optimizeImageUrl(product.images?.[0])} 
            alt={cleanTitle} 
            className="h-full w-full object-contain hover:scale-105 transition"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {product.brand}
            </span>
            <Link to={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-400 flex items-center gap-1">
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <Link to={`/products/${product.slug}`} className="text-sm font-bold text-white hover:text-blue-400 block truncate mt-1">
            {cleanTitle}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {Object.entries(product.specs || {})
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(',') : v}`)
              .slice(0, 3)
              .join(' | ')}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-extrabold text-white">
            {displayPrice}
          </p>
        </div>
        <button 
          onClick={() => handleRemove(key, product.id)}
          className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-700 transition shrink-0 focus-visible:ring-2 focus-visible:ring-red-400 focus:outline-none"
          title="Remove component"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Custom PC Part Builder" 
        description="Design and architect your custom PC build with real-time heuristic compatibility validation, wattage calculation, and bottleneck analysis on BuildForge." 
      />
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Wrench className="w-3.5 h-3.5" />
              <span>Smart PC Builder & Compatibility Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              PC Part Builder
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Select components or auto-generate a balanced gaming/workstation build with real-time heuristic validation.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => setShowAutoBuildModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 transition"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Auto-Build from Budget</span>
            </button>
            <button 
              onClick={() => setBuildIds({cpu: null, cooler: null, motherboard: null, ram: [], gpu: null, storage: [], case: null, psu: null})}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button 
              onClick={() => user ? setShowSaveModal(true) : alert('Please log in to save a build.')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Builder Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Component Slots Table */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-800/40 p-4 sm:p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3">
                System Components
              </h2>

              <div className="space-y-4">
                {COMPONENT_SLOTS.map((slot) => {
                  const items = slot.isArray 
                    ? (populatedBuild[slot.key] || []) 
                    : (populatedBuild[slot.key] ? [populatedBuild[slot.key]] : []);
                  
                  return (
                    <div key={slot.key} className="rounded-xl bg-gray-900/60 border border-gray-800/80 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          {slot.label}
                        </span>
                        {items.length > 0 && slot.isArray && (
                          <button 
                            onClick={() => openModal(slot)}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Another</span>
                          </button>
                        )}
                      </div>

                      {items.length > 0 ? (
                        <div className="space-y-2">
                          {items.map(product => (
                            <div key={product.id}>
                              {renderProductSlot(product, slot.key)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button 
                          onClick={() => openModal(slot)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 bg-gray-800/40 p-4 text-xs sm:text-sm font-semibold text-gray-400 hover:border-blue-500/50 hover:bg-blue-600/10 hover:text-blue-400 transition group"
                        >
                          <Plus className="w-4 h-4 group-hover:scale-110 transition" />
                          <span>Choose a {slot.label}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Validation & Advisory Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-gray-800 bg-gray-800/60 p-6 shadow-xl sticky top-6 space-y-6">
              
              {/* Estimated Price */}
              <div className="border-b border-gray-800 pb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Estimated Total
                </p>
                <p className="text-3xl font-extrabold text-white">
                  {formatINR(validationResult?.totalPrice || 0)}
                </p>
              </div>

              {/* Performance & Advisory Analysis */}
              <div className="border-b border-gray-800 pb-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">Advisory & Bottleneck</h3>
                  <select 
                    value={targetResolution} 
                    onChange={e => setTargetResolution(e.target.value)}
                    className="rounded-lg border border-gray-700 bg-gray-900 text-gray-200 px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="1080p">1080p FHD</option>
                    <option value="1440p">1440p QHD</option>
                    <option value="4K">4K UHD</option>
                  </select>
                </div>

                {/* Power Visualizer */}
                <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Estimated Draw</span>
                    </span>
                    <span className="font-bold text-white">{validationResult?.estimatedWattage || 0}W</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Recommended PSU</span>
                    <span className="font-bold text-blue-400">{validationResult?.recommendedWattage || 0}W</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                    <div 
                      className={`h-full ${validationResult?.errors?.some(e => e.code === 'INSUFFICIENT_WATTAGE') ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${Math.min(100, ((validationResult?.estimatedWattage || 0) / (populatedBuild?.psu?.specs?.wattage || 850)) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Bottleneck Indicator */}
                {validationResult?.bottleneck && (
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    validationResult.bottleneck.component === 'none' 
                      ? 'bg-green-950/40 border-green-800 text-green-300' 
                      : 'bg-yellow-950/40 border-yellow-800 text-yellow-300'
                  }`}>
                    <span className="font-bold block mb-0.5">Bottleneck Status:</span>
                    {validationResult.bottleneck.message}
                  </div>
                )}

                {/* FPS Estimates */}
                {validationResult?.performanceEstimate && (
                  <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300">Expected FPS ({validationResult.performanceEstimate.resolution})</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">Estimate</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-gray-800/80 p-2 rounded-lg border border-gray-700/50">
                        <span className="block text-[10px] text-gray-400">E-Sports</span>
                        <span className="font-bold text-white text-sm">{validationResult.performanceEstimate.esports}</span>
                      </div>
                      <div className="bg-gray-800/80 p-2 rounded-lg border border-gray-700/50">
                        <span className="block text-[10px] text-gray-400">AAA Titles</span>
                        <span className="font-bold text-white text-sm">{validationResult.performanceEstimate.aaa}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Build Compatibility Status & Warnings */}
              <div className="space-y-3">
                <h3 className="font-bold text-white text-sm">Compatibility Status</h3>

                {loading && (
                  <div className="text-xs text-blue-400 animate-pulse flex items-center gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border border-blue-400 border-t-transparent" />
                    <span>Analyzing compatibility...</span>
                  </div>
                )}

                {!loading && validationResult?.valid && (
                  <div className="p-3 rounded-xl bg-green-950/30 border border-green-800/60 text-green-300 text-xs flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <span>No compatibility issues detected.</span>
                  </div>
                )}

                {/* Suggestions Cards */}
                {validationResult?.suggestions?.map((s, i) => (
                  <div key={`sug-${i}`} className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/60 text-xs text-blue-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{s.message}</span>
                    </div>
                    <button 
                      onClick={() => handleApplySuggestion(s)}
                      className="w-full py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                    >
                      {s.action}
                    </button>
                  </div>
                ))}

                {/* Error Items */}
                {validationResult?.errors?.map((err, i) => (
                  <div key={`err-${i}`} className="p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold block text-red-300">{err.code}</span>
                      <span>{err.humanMessage}</span>
                    </div>
                  </div>
                ))}

                {/* Warning Items */}
                {validationResult?.warnings?.map((warn, i) => (
                  <div key={`warn-${i}`} className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-800/80 text-yellow-200 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span>{warn.humanMessage}</span>
                  </div>
                ))}

                {/* Info Items */}
                {validationResult?.info?.map((info, i) => (
                  <div key={`info-${i}`} className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>{info.humanMessage}</span>
                  </div>
                ))}
              </div>

              {/* Add All to Cart */}
              <button
                onClick={handleAddAllToCart}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg hover:bg-blue-500 transition flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add All to Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Component Selector Modal */}
        <ComponentSelectModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)}
          type={activeSlot?.key}
          onSelect={handleSelect}
        />

        {/* Auto-Build Modal */}
        {showAutoBuildModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 p-6 shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Auto-Generate Build</h2>
                  <p className="text-xs text-gray-400">Algorithmic component balancing by budget</p>
                </div>
              </div>

              <form onSubmit={handleAutoBuild} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Target Budget ($ USD)</label>
                  <input 
                    type="number" min="500" max="5000" step="50"
                    value={autoBuildParams.budget} 
                    onChange={(e) => setAutoBuildParams({...autoBuildParams, budget: Number(e.target.value)})} 
                    required 
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Primary Use Case</label>
                  <select 
                    value={autoBuildParams.useCase} 
                    onChange={(e) => setAutoBuildParams({...autoBuildParams, useCase: e.target.value})}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="gaming">Gaming</option>
                    <option value="workstation">Workstation / Productivity</option>
                    <option value="office">Office / Basic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Target Resolution</label>
                  <select 
                    value={autoBuildParams.resolution} 
                    onChange={(e) => setAutoBuildParams({...autoBuildParams, resolution: e.target.value})}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="1080p">1080p FHD</option>
                    <option value="1440p">1440p QHD</option>
                    <option value="4K">4K UHD</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAutoBuildModal(false)}
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-800 py-2.5 text-xs sm:text-sm font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isAutoBuilding}
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-500 transition disabled:opacity-50"
                  >
                    {isAutoBuilding ? 'Generating...' : 'Auto-Build'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Save Build Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700 p-6 shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Save Custom Build</h2>
                  <p className="text-xs text-gray-400">Save configuration to your account</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Configuration Name</label>
                  <input 
                    type="text" 
                    value={saveName} 
                    onChange={(e) => setSaveName(e.target.value)} 
                    required 
                    placeholder="e.g. Dream 1440p Gaming Rig"
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-800 py-2.5 text-xs sm:text-sm font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-500 transition disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
