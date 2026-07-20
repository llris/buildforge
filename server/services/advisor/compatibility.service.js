// Pure Compatibility Service

/**
 * Validates a PC build configuration based on hard rules.
 * 
 * @param {Object} build - The selected components
 * @param {Object} build.cpu - CPU product object (must contain specs)
 * @param {Object} build.motherboard - Motherboard product object
 * @param {Array} build.ram - Array of RAM product objects
 * @param {Object} build.gpu - GPU product object
 * @param {Object} build.case - Case product object (property named 'case' or 'pcCase')
 * @param {Object} build.psu - PSU product object
 * @param {Array} build.storage - Array of Storage product objects
 * @param {Object} build.cooler - CPU Cooler product object
 * 
 * @returns {Object} validation result
 */
function validateBuild(build) {
  const errors = [];
  const warnings = [];
  const info = [];
  
  // Safe extraction (case might be reserved in JS, so allowing pcCase or case)
  const cpu = build.cpu;
  const motherboard = build.motherboard;
  const ram = build.ram || [];
  const gpu = build.gpu;
  const pcCase = build.pcCase || build.case;
  const psu = build.psu;
  const storage = build.storage || [];
  const cooler = build.cooler;

  let estimatedWattage = 150; // Base wattage
  let totalPrice = 0;
  
  // Helper to add price
  const addPrice = (component) => {
    if (component) {
      totalPrice += component.discountPrice || component.price || 0;
    }
  };
  
  // Helper to calculate TDP
  const addTdp = (component) => {
    if (component?.specs?.tdp) {
      estimatedWattage += Number(component.specs.tdp);
    }
  };

  addPrice(cpu); addTdp(cpu);
  addPrice(motherboard); addTdp(motherboard);
  ram.forEach(r => { addPrice(r); addTdp(r); });
  addPrice(gpu); addTdp(gpu);
  addPrice(pcCase); addTdp(pcCase);
  addPrice(psu);
  storage.forEach(s => { addPrice(s); addTdp(s); });
  addPrice(cooler); addTdp(cooler);

  // --- Rule 1: CPU Socket === Motherboard Socket ---
  if (cpu && motherboard) {
    if (cpu.specs?.socket !== motherboard.specs?.socket) {
      errors.push({
        code: 'SOCKET_MISMATCH',
        severity: 'error',
        humanMessage: `The CPU socket (${cpu.specs?.socket || 'Unknown'}) does not match the Motherboard socket (${motherboard.specs?.socket || 'Unknown'}).`,
        affectedComponents: ['cpu', 'motherboard']
      });
    }
  }

  // --- Rule 2, 3, 4: RAM constraints against Motherboard ---
  if (motherboard && ram.length > 0) {
    const mbMemType = motherboard.specs?.memoryType;
    const mbMaxMem = motherboard.specs?.maxMemory ? Number(motherboard.specs.maxMemory) : Infinity;
    const mbSlots = motherboard.specs?.memorySlots ? Number(motherboard.specs.memorySlots) : Infinity;

    let totalModules = 0;
    let totalCapacity = 0;
    let hasMemoryTypeError = false;

    ram.forEach(r => {
      // Memory Type
      if (r.specs?.memoryType && mbMemType && r.specs.memoryType !== mbMemType) {
        hasMemoryTypeError = true;
      }
      
      const modules = r.specs?.modules ? Number(r.specs.modules) : 1;
      const capPerModule = r.specs?.capacityPerModule ? Number(r.specs.capacityPerModule) : 8;
      
      totalModules += modules;
      totalCapacity += (modules * capPerModule);
    });

    if (hasMemoryTypeError) {
      errors.push({
        code: 'MEMORY_TYPE_MISMATCH',
        severity: 'error',
        humanMessage: `The selected RAM memory type does not match the motherboard's supported memory type (${mbMemType}).`,
        affectedComponents: ['ram', 'motherboard']
      });
    }

    if (totalModules > mbSlots) {
      errors.push({
        code: 'TOO_MANY_RAM_MODULES',
        severity: 'error',
        humanMessage: `You have selected ${totalModules} RAM modules, but the motherboard only supports ${mbSlots} slots.`,
        affectedComponents: ['ram', 'motherboard']
      });
    }

    if (totalCapacity > mbMaxMem) {
      errors.push({
        code: 'RAM_CAPACITY_EXCEEDED',
        severity: 'error',
        humanMessage: `Total RAM capacity (${totalCapacity}GB) exceeds motherboard's maximum supported capacity (${mbMaxMem}GB).`,
        affectedComponents: ['ram', 'motherboard']
      });
    }
  }

  // --- Rule 5: Motherboard Form Factor in Case Form Factors ---
  if (motherboard && pcCase) {
    const supportedFormFactors = pcCase.specs?.formFactorsSupported || [];
    const mbFormFactor = motherboard.specs?.formFactor;
    
    if (mbFormFactor && !supportedFormFactors.includes(mbFormFactor)) {
      errors.push({
        code: 'INCOMPATIBLE_FORM_FACTOR',
        severity: 'error',
        humanMessage: `The case does not support the motherboard's form factor (${mbFormFactor}).`,
        affectedComponents: ['motherboard', 'case']
      });
    }
  }

  // --- Rule 6: GPU Length vs Case Max GPU Length ---
  if (gpu && pcCase) {
    const gpuLen = gpu.specs?.lengthMm ? Number(gpu.specs.lengthMm) : 0;
    const caseMaxGpu = pcCase.specs?.maxGpuLengthMm ? Number(pcCase.specs.maxGpuLengthMm) : Infinity;
    
    if (gpuLen > caseMaxGpu) {
      errors.push({
        code: 'GPU_CLEARANCE_ERROR',
        severity: 'error',
        humanMessage: `The GPU length (${gpuLen}mm) exceeds the case's maximum supported length (${caseMaxGpu}mm).`,
        affectedComponents: ['gpu', 'case']
      });
    }
  }

  // --- Rule 7: Cooler Clearance / Radiator Support vs Case ---
  if (cooler && pcCase) {
    const isAIO = cooler.specs?.type?.toLowerCase() === 'aio';
    
    if (isAIO) {
      const radSize = cooler.specs?.radiatorSizeMm ? Number(cooler.specs.radiatorSizeMm) : 0;
      const radSupport = pcCase.specs?.radiatorSupport || [];
      if (!radSupport.includes(radSize) && !radSupport.includes(String(radSize))) {
        errors.push({
          code: 'RADIATOR_SUPPORT_ERROR',
          severity: 'error',
          humanMessage: `The case does not support a ${radSize}mm radiator.`,
          affectedComponents: ['cooler', 'case']
        });
      }
    } else {
      const coolerHeight = cooler.specs?.heightMm ? Number(cooler.specs.heightMm) : 0;
      const caseMaxHeight = pcCase.specs?.maxCoolerHeightMm ? Number(pcCase.specs.maxCoolerHeightMm) : Infinity;
      if (coolerHeight > caseMaxHeight) {
        errors.push({
          code: 'COOLER_CLEARANCE_ERROR',
          severity: 'error',
          humanMessage: `The air cooler height (${coolerHeight}mm) exceeds the case's maximum cooler clearance (${caseMaxHeight}mm).`,
          affectedComponents: ['cooler', 'case']
        });
      }
    }
  }

  // --- Rule 8: CPU Socket in Cooler Supported Sockets ---
  if (cpu && cooler) {
    const cpuSocket = cpu.specs?.socket;
    const supportedSockets = cooler.specs?.supportedSockets || [];
    
    if (cpuSocket && !supportedSockets.includes(cpuSocket)) {
      errors.push({
        code: 'COOLER_SOCKET_ERROR',
        severity: 'error',
        humanMessage: `The cooler does not support the CPU socket (${cpuSocket}).`,
        affectedComponents: ['cpu', 'cooler']
      });
    }
  }

  // --- Rule 9: Storage Drive Count vs Motherboard Connections ---
  if (motherboard && storage.length > 0) {
    const mbM2Slots = motherboard.specs?.m2Slots ? Number(motherboard.specs.m2Slots) : 0;
    const mbSata = motherboard.specs?.sataConnectors ? Number(motherboard.specs.sataConnectors) : 0;
    
    let nvmeCount = 0;
    let sataCount = 0;
    
    storage.forEach(s => {
      const sInterface = s.specs?.interface || '';
      if (sInterface.toLowerCase().includes('nvme') || sInterface.toLowerCase().includes('m.2')) {
        nvmeCount++;
      } else if (sInterface.toLowerCase().includes('sata')) {
        sataCount++;
      }
    });

    if (nvmeCount > mbM2Slots) {
      errors.push({
        code: 'M2_SLOTS_EXCEEDED',
        severity: 'error',
        humanMessage: `You have selected ${nvmeCount} M.2/NVMe drives, but the motherboard only has ${mbM2Slots} M.2 slots.`,
        affectedComponents: ['storage', 'motherboard']
      });
    }

    if (sataCount > mbSata) {
      errors.push({
        code: 'SATA_PORTS_EXCEEDED',
        severity: 'error',
        humanMessage: `You have selected ${sataCount} SATA drives, but the motherboard only has ${mbSata} SATA ports.`,
        affectedComponents: ['storage', 'motherboard']
      });
    }
  }

  // --- Rule 10: PSU Wattage >= Estimated Wattage ---
  if (psu) {
    const psuWattage = psu.specs?.wattage ? Number(psu.specs.wattage) : 0;
    if (psuWattage < estimatedWattage) {
      errors.push({
        code: 'INSUFFICIENT_WATTAGE',
        severity: 'error',
        humanMessage: `The selected PSU wattage (${psuWattage}W) is lower than the estimated system wattage (${estimatedWattage}W).`,
        affectedComponents: ['psu', 'cpu', 'gpu']
      });
    }
  } else {
    // If no PSU, add an info/warning indicating we calculated wattage
    info.push({
      code: 'WATTAGE_ESTIMATION',
      severity: 'info',
      humanMessage: `Estimated wattage is ${estimatedWattage}W. Select a PSU with at least this capacity.`,
      affectedComponents: []
    });
  }

  // Warning check: no dedicated GPU and CPU doesn't have integrated graphics
  if (cpu && !gpu) {
    const integrated = cpu.specs?.integratedGraphics;
    if (integrated === false || integrated === 'false') {
      warnings.push({
        code: 'NO_DISPLAY_OUTPUT',
        severity: 'warning',
        humanMessage: 'The selected CPU does not have integrated graphics. You must add a GPU to output video.',
        affectedComponents: ['cpu', 'gpu']
      });
    }
  }
  
  // Calculate a mock "build score" based on CPU+GPU performance
  let buildScore = 0;
  if (cpu) buildScore += cpu.specs?.performanceScore ? Number(cpu.specs.performanceScore) : 0;
  if (gpu) buildScore += gpu.specs?.performanceScore ? Number(gpu.specs.performanceScore) : 0;
  
  // Simple normalize: max score approx 100 for a flagship build
  if (buildScore > 0) {
    buildScore = Math.min(100, Math.round((buildScore / 200) * 100)); 
  } else {
    buildScore = 0;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    estimatedWattage,
    totalPrice,
    buildScore
  };
}

module.exports = {
  validateBuild
};
