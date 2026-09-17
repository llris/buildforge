import React from 'react';

export default function CategorySpecFields({ categorySlug = '', specs = {}, onChange }) {
  const normalizedCategory = (categorySlug || '').toLowerCase();

  const handleFieldChange = (key, value) => {
    onChange({
      ...specs,
      [key]: value,
    });
  };

  const handleArrayToggle = (key, item) => {
    const currentList = Array.isArray(specs[key]) ? specs[key] : [];
    const nextList = currentList.includes(item)
      ? currentList.filter((i) => i !== item)
      : [...currentList, item];
    onChange({
      ...specs,
      [key]: nextList,
    });
  };

  if (normalizedCategory.includes('cpu') || normalizedCategory.includes('processor')) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Socket (e.g. AM5, LGA1700)
          </label>
          <input
            type="text"
            value={specs.socket || ''}
            onChange={(e) => handleFieldChange('socket', e.target.value)}
            placeholder="AM5"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            TDP (Watts)
          </label>
          <input
            type="number"
            value={specs.tdp || ''}
            onChange={(e) => handleFieldChange('tdp', Number(e.target.value))}
            placeholder="105"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Core Count
          </label>
          <input
            type="number"
            value={specs.coreCount || ''}
            onChange={(e) => handleFieldChange('coreCount', Number(e.target.value))}
            placeholder="8"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Max Memory Speed (MHz)
          </label>
          <input
            type="number"
            value={specs.maxMemorySpeed || ''}
            onChange={(e) => handleFieldChange('maxMemorySpeed', Number(e.target.value))}
            placeholder="5200"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Performance Score (0 - 100)
          </label>
          <input
            type="number"
            value={specs.performanceScore || ''}
            onChange={(e) => handleFieldChange('performanceScore', Number(e.target.value))}
            placeholder="88"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-2 pt-4">
          <input
            type="checkbox"
            id="integratedGraphics"
            checked={!!specs.integratedGraphics}
            onChange={(e) => handleFieldChange('integratedGraphics', e.target.checked)}
            className="rounded text-blue-600"
          />
          <label htmlFor="integratedGraphics" className="text-xs font-bold text-gray-700">
            Integrated Graphics (iGPU)
          </label>
        </div>
      </div>
    );
  }

  if (normalizedCategory.includes('gpu') || normalizedCategory.includes('graphics')) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Length (mm)
          </label>
          <input
            type="number"
            value={specs.lengthMm || ''}
            onChange={(e) => handleFieldChange('lengthMm', Number(e.target.value))}
            placeholder="304"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            TDP (Watts)
          </label>
          <input
            type="number"
            value={specs.tdp || ''}
            onChange={(e) => handleFieldChange('tdp', Number(e.target.value))}
            placeholder="285"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            VRAM (GB)
          </label>
          <input
            type="number"
            value={specs.vramGb || ''}
            onChange={(e) => handleFieldChange('vramGb', Number(e.target.value))}
            placeholder="16"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Recommended PSU (Watts)
          </label>
          <input
            type="number"
            value={specs.recommendedPsuWattage || ''}
            onChange={(e) => handleFieldChange('recommendedPsuWattage', Number(e.target.value))}
            placeholder="750"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Performance Score (0 - 100)
          </label>
          <input
            type="number"
            value={specs.performanceScore || ''}
            onChange={(e) => handleFieldChange('performanceScore', Number(e.target.value))}
            placeholder="92"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>
      </div>
    );
  }

  if (normalizedCategory.includes('motherboard') || normalizedCategory.includes('mobo')) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Socket
          </label>
          <input
            type="text"
            value={specs.socket || ''}
            onChange={(e) => handleFieldChange('socket', e.target.value)}
            placeholder="AM5"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Chipset
          </label>
          <input
            type="text"
            value={specs.chipset || ''}
            onChange={(e) => handleFieldChange('chipset', e.target.value)}
            placeholder="B650"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Form Factor
          </label>
          <select
            value={specs.formFactor || 'ATX'}
            onChange={(e) => handleFieldChange('formFactor', e.target.value)}
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="ATX">ATX</option>
            <option value="Micro-ATX">Micro-ATX</option>
            <option value="Mini-ITX">Mini-ITX</option>
            <option value="E-ATX">E-ATX</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Memory Type
          </label>
          <select
            value={specs.memoryType || 'DDR5'}
            onChange={(e) => handleFieldChange('memoryType', e.target.value)}
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="DDR5">DDR5</option>
            <option value="DDR4">DDR4</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Memory Slots
          </label>
          <input
            type="number"
            value={specs.memorySlots || 4}
            onChange={(e) => handleFieldChange('memorySlots', Number(e.target.value))}
            placeholder="4"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            M.2 Slots
          </label>
          <input
            type="number"
            value={specs.m2Slots || 2}
            onChange={(e) => handleFieldChange('m2Slots', Number(e.target.value))}
            placeholder="3"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>
      </div>
    );
  }

  if (normalizedCategory.includes('ram') || normalizedCategory.includes('memory')) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Memory Generation
          </label>
          <select
            value={specs.memoryType || 'DDR5'}
            onChange={(e) => handleFieldChange('memoryType', e.target.value)}
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="DDR5">DDR5</option>
            <option value="DDR4">DDR4</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Speed (MHz)
          </label>
          <input
            type="number"
            value={specs.speed || ''}
            onChange={(e) => handleFieldChange('speed', Number(e.target.value))}
            placeholder="6000"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Number of Modules
          </label>
          <input
            type="number"
            value={specs.modules || 2}
            onChange={(e) => handleFieldChange('modules', Number(e.target.value))}
            placeholder="2"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Capacity per Module (GB)
          </label>
          <input
            type="number"
            value={specs.capacityPerModule || 16}
            onChange={(e) => handleFieldChange('capacityPerModule', Number(e.target.value))}
            placeholder="16"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>
      </div>
    );
  }

  if (normalizedCategory.includes('psu') || normalizedCategory.includes('power')) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Wattage (W)
          </label>
          <input
            type="number"
            value={specs.wattage || ''}
            onChange={(e) => handleFieldChange('wattage', Number(e.target.value))}
            placeholder="850"
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Efficiency Rating
          </label>
          <select
            value={specs.efficiencyRating || '80+ Gold'}
            onChange={(e) => handleFieldChange('efficiencyRating', e.target.value)}
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="80+ Bronze">80+ Bronze</option>
            <option value="80+ Silver">80+ Silver</option>
            <option value="80+ Gold">80+ Gold</option>
            <option value="80+ Platinum">80+ Platinum</option>
            <option value="80+ Titanium">80+ Titanium</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Modularity
          </label>
          <select
            value={specs.modular || 'Full'}
            onChange={(e) => handleFieldChange('modular', e.target.value)}
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="Full">Full Modular</option>
            <option value="Semi">Semi-Modular</option>
            <option value="Non-Modular">Non-Modular</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Form Factor
          </label>
          <select
            value={specs.formFactor || 'ATX'}
            onChange={(e) => handleFieldChange('formFactor', e.target.value)}
            className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="ATX">ATX</option>
            <option value="SFX">SFX</option>
            <option value="SFX-L">SFX-L</option>
          </select>
        </div>
      </div>
    );
  }

  if (normalizedCategory.includes('case')) {
    const caseFormFactors = ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'];
    return (
      <div className="space-y-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-2">
            Form Factors Supported
          </label>
          <div className="flex flex-wrap gap-2">
            {caseFormFactors.map((ff) => (
              <button
                type="button"
                key={ff}
                onClick={() => handleArrayToggle('formFactorsSupported', ff)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                  (specs.formFactorsSupported || []).includes(ff)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {ff}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Max GPU Length (mm)
            </label>
            <input
              type="number"
              value={specs.maxGpuLengthMm || ''}
              onChange={(e) => handleFieldChange('maxGpuLengthMm', Number(e.target.value))}
              placeholder="380"
              className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Max Cooler Height (mm)
            </label>
            <input
              type="number"
              value={specs.maxCoolerHeightMm || ''}
              onChange={(e) => handleFieldChange('maxCoolerHeightMm', Number(e.target.value))}
              placeholder="170"
              className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2"
            />
          </div>
        </div>
      </div>
    );
  }

  // Fallback generic / JSON editor for other categories (Storage, Coolers, etc.)
  return (
    <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
          Specification Parameters (JSON / Key-Value)
        </label>
        <span className="text-[10px] text-gray-400">Custom Attributes</span>
      </div>
      <textarea
        rows={4}
        value={typeof specs === 'string' ? specs : JSON.stringify(specs, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            onChange(parsed);
          } catch {
            // Keep raw if invalid temporarily
          }
        }}
        placeholder='{ "capacityGb": 2000, "interface": "M.2 NVMe", "formFactor": "M.2 2280" }'
        className="w-full font-mono text-xs bg-white border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
