// Pure Compatibility Service

/**
 * Validates a PC build configuration based on hard rules and provides advisory analysis.
 * 
 * @param {Object} build - The selected components
 * @param {Object} options - Additional options (resolution, catalog)
 * 
 * @returns {Object} validation result
 */
function validateBuild(build, options = {}) {
  const { resolution = '1440p', catalog = {} } = options;
  const errors = [];
  const warnings = [];
  const info = [];
  let suggestions = [];
  
  // Safe extraction
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

  const recommendedWattage = Math.ceil(estimatedWattage / 0.6);

  // Helper to add fix-it suggestion
  const addFixIt = (targetComponent, message, conditionFn) => {
    const list = catalog[targetComponent];
    if (!list || !Array.isArray(list)) return;
    const candidate = list.find(conditionFn);
    if (candidate) {
      suggestions.push({
        type: 'fix-it',
        message: `${message} Try swapping to ${candidate.name}.`,
        action: 'Apply',
        targetComponent,
        replacementProductId: candidate.id
      });
    }
  };

  // --- Rule 1: CPU Socket === Motherboard Socket ---
  if (cpu && motherboard) {
    if (cpu.specs?.socket !== motherboard.specs?.socket) {
      errors.push({
        code: 'SOCKET_MISMATCH',
        severity: 'error',
        humanMessage: `The CPU socket (${cpu.specs?.socket || 'Unknown'}) does not match the Motherboard socket (${motherboard.specs?.socket || 'Unknown'}).`,
        affectedComponents: ['cpu', 'motherboard']
      });
      addFixIt('motherboard', 'Find a compatible motherboard for your CPU.', m => m.specs?.socket === cpu.specs?.socket);
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
      addFixIt('ram', `Switch to ${mbMemType} RAM.`, r => r.specs?.memoryType === mbMemType);
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
      addFixIt('case', 'Find a case that supports your motherboard.', c => c.specs?.formFactorsSupported?.includes(mbFormFactor));
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
      addFixIt('case', 'Find a larger case for your GPU.', c => Number(c.specs?.maxGpuLengthMm || 0) >= gpuLen);
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
        addFixIt('case', 'Find a case that fits your AIO.', c => c.specs?.radiatorSupport?.includes(radSize) || c.specs?.radiatorSupport?.includes(String(radSize)));
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
        addFixIt('cooler', 'Get a lower-profile cooler.', c => Number(c.specs?.heightMm || 0) <= caseMaxHeight);
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
      addFixIt('cooler', 'Find a cooler that fits your CPU socket.', c => c.specs?.supportedSockets?.includes(cpuSocket));
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
      addFixIt('psu', `Get a power supply with at least ${recommendedWattage}W.`, p => Number(p.specs?.wattage) >= recommendedWattage);
    } else if ((psuWattage - estimatedWattage) / psuWattage < 0.2) {
      warnings.push({
        code: 'LOW_PSU_HEADROOM',
        severity: 'warning',
        humanMessage: `Your PSU headroom is less than 20%. Consider upgrading to at least ${recommendedWattage}W for better efficiency and future upgrades.`,
        affectedComponents: ['psu']
      });
      addFixIt('psu', 'Upgrade for better headroom.', p => Number(p.specs?.wattage) >= recommendedWattage);
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

  // --- Complete Your Build Suggestions ---
  if (!psu && cpu && motherboard) {
    suggestions.push({
      type: 'complete-build',
      message: 'You are missing a Power Supply Unit (PSU).',
      action: 'Select PSU',
      targetComponent: 'psu'
    });
  }
  if (storage.length === 0 && cpu && motherboard) {
    suggestions.push({
      type: 'complete-build',
      message: 'You need at least one storage drive for the OS.',
      action: 'Select Storage',
      targetComponent: 'storage'
    });
  }
  if (cpu && !cooler) {
    const integrated = cpu.specs?.integratedGraphics;
    if (integrated === false || integrated === 'false') {
       suggestions.push({
         type: 'complete-build',
         message: 'You have not selected a CPU Cooler.',
         action: 'Select Cooler',
         targetComponent: 'cooler'
       });
    }
  }

  // --- Thermal Sanity ---
  if (cpu && cooler) {
    const cpuTdp = Number(cpu.specs?.tdp || 0);
    const isAir = cooler.specs?.type?.toLowerCase() === 'air';
    const height = Number(cooler.specs?.heightMm || 0);
    if (cpuTdp > 105 && isAir && height < 150) {
      warnings.push({
        code: 'THERMAL_WARNING',
        severity: 'warning',
        humanMessage: 'You paired a high-TDP CPU with a low-profile air cooler. Consider a larger cooler or AIO.',
        affectedComponents: ['cpu', 'cooler']
      });
      addFixIt('cooler', 'Upgrade your cooling solution.', c => c.specs?.type?.toLowerCase() === 'aio' || Number(c.specs?.heightMm || 0) >= 150);
    }
  }

  // --- Memory Optimization ---
  if (cpu && ram.length > 0) {
    const maxSpeed = Number(cpu.specs?.maxMemorySpeed || Infinity);
    const rSpeed = Number(ram[0].specs?.speed || 0);
    const rModules = Number(ram[0].specs?.modules || 1);
    
    if (rModules === 1) {
      info.push({
        code: 'SINGLE_CHANNEL_MEMORY',
        severity: 'info',
        humanMessage: 'A single RAM stick is selected. Dual-channel memory (2 sticks) provides better performance.',
        affectedComponents: ['ram']
      });
      addFixIt('ram', 'Switch to a dual-channel kit.', r => Number(r.specs?.modules || 0) >= 2);
    }
    
    if (rSpeed > maxSpeed) {
      warnings.push({
        code: 'MEMORY_SPEED_EXCEEDS_CPU',
        severity: 'warning',
        humanMessage: `RAM speed (${rSpeed}MHz) exceeds CPU's supported speed (${maxSpeed}MHz). It may downclock.`,
        affectedComponents: ['cpu', 'ram']
      });
    }
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
  let cpuScore = cpu?.specs?.performanceScore ? Number(cpu.specs.performanceScore) : 0;
  let gpuScore = gpu?.specs?.performanceScore ? Number(gpu.specs.performanceScore) : 0;
  
  let buildScore = 0;
  if (cpuScore || gpuScore) {
    buildScore = Math.min(100, Math.round(((cpuScore + gpuScore) / 200) * 100)); 
  }

  // --- Bottleneck Analysis ---
  let bottleneck = null;
  let performanceEstimate = null;

  if (cpu && gpu) {
    let cpuWeight = 1.0;
    let gpuWeight = 1.0;
    if (resolution === '1080p') {
      cpuWeight = 1.2;
    } else if (resolution === '4K') {
      gpuWeight = 1.2;
    }

    const weightedCpu = cpuScore * cpuWeight;
    const weightedGpu = gpuScore * gpuWeight;

    if (weightedGpu > weightedCpu + 25) {
      bottleneck = {
        component: 'cpu',
        message: `At ${resolution}, your CPU is significantly weaker than your GPU. You may experience a CPU bottleneck.`
      };
      warnings.push({
        code: 'CPU_BOTTLENECK',
        severity: 'warning',
        humanMessage: bottleneck.message,
        affectedComponents: ['cpu', 'gpu']
      });
      addFixIt('cpu', 'Consider a faster CPU.', c => Number(c.specs?.performanceScore || 0) > cpuScore + 10);
    } else if (weightedCpu > weightedGpu + 25) {
      bottleneck = {
        component: 'gpu',
        message: `At ${resolution}, your GPU is holding back your CPU. Consider a stronger GPU.`
      };
      warnings.push({
        code: 'GPU_BOTTLENECK',
        severity: 'warning',
        humanMessage: bottleneck.message,
        affectedComponents: ['cpu', 'gpu']
      });
      addFixIt('gpu', 'Consider a stronger GPU.', g => Number(g.specs?.performanceScore || 0) > gpuScore + 10);
    } else {
      bottleneck = {
        component: 'none',
        message: `Great balance! Your CPU and GPU are well matched for ${resolution} gaming.`
      };
    }

    // Performance Estimate (FPS bands)
    const combined = weightedCpu + weightedGpu;
    let esports, aaa;
    if (combined < 80) {
      esports = '60-90 FPS';
      aaa = '30-45 FPS';
    } else if (combined < 140) {
      esports = '120-180 FPS';
      aaa = '60-80 FPS';
    } else {
      esports = '240+ FPS';
      aaa = '90-120+ FPS';
    }
    performanceEstimate = {
      resolution,
      esports,
      aaa
    };
  }

  // --- Smart Alternative Suggestion ---
  if (gpu && suggestions.length < 5 && catalog['gpu']) {
    const gpuPrice = gpu.discountPrice || gpu.price || 0;
    const upgradeGpu = catalog['gpu'].find(g => {
      const price = g.discountPrice || g.price || 0;
      const score = Number(g.specs?.performanceScore || 0);
      return score > gpuScore + 5 && price <= gpuPrice + 50 && price > gpuPrice;
    });
    if (upgradeGpu) {
      suggestions.push({
        type: 'smart-alternative',
        message: `For just a bit more, you can upgrade to the ${upgradeGpu.name} for better performance.`,
        action: 'Upgrade GPU',
        targetComponent: 'gpu',
        replacementProductId: upgradeGpu.id
      });
    }
  }

  // Limit suggestions to max 5
  suggestions = suggestions.slice(0, 5);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    estimatedWattage,
    recommendedWattage,
    totalPrice,
    buildScore,
    bottleneck,
    performanceEstimate,
    suggestions
  };
}

module.exports = {
  validateBuild
};
