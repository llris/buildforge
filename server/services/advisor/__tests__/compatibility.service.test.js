import { describe, it, expect } from 'vitest';
const { validateBuild } = require('../compatibility.service');

describe('Compatibility Service Validation', () => {
  it('should return valid and 150W for an empty build', () => {
    const res = validateBuild({});
    expect(res.valid).toBe(true);
    expect(res.estimatedWattage).toBe(150);
    expect(res.totalPrice).toBe(0);
    expect(res.errors).toHaveLength(0);
  });

  describe('Rule 1: CPU Socket === Motherboard Socket', () => {
    it('should fail when CPU socket does not match Motherboard socket', () => {
      const build = {
        cpu: { specs: { socket: 'AM5' } },
        motherboard: { specs: { socket: 'LGA1700' } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'SOCKET_MISMATCH' }));
    });

    it('should pass when sockets match', () => {
      const build = {
        cpu: { specs: { socket: 'AM5' } },
        motherboard: { specs: { socket: 'AM5' } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(true);
    });
  });

  describe('Rules 2, 3, 4: RAM Constraints', () => {
    it('should fail on memory type mismatch', () => {
      const build = {
        motherboard: { specs: { memoryType: 'DDR5' } },
        ram: [{ specs: { memoryType: 'DDR4', modules: 2, capacityPerModule: 8 } }]
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'MEMORY_TYPE_MISMATCH' }));
    });

    it('should fail when too many modules', () => {
      const build = {
        motherboard: { specs: { memorySlots: 2 } },
        ram: [
          { specs: { modules: 2 } },
          { specs: { modules: 2 } } // total 4 modules
        ]
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'TOO_MANY_RAM_MODULES' }));
    });

    it('should fail when RAM capacity exceeded', () => {
      const build = {
        motherboard: { specs: { maxMemory: 32 } },
        ram: [
          { specs: { modules: 2, capacityPerModule: 32 } } // total 64GB
        ]
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'RAM_CAPACITY_EXCEEDED' }));
    });

    it('should pass when RAM matches motherboard', () => {
      const build = {
        motherboard: { specs: { memoryType: 'DDR5', memorySlots: 4, maxMemory: 128 } },
        ram: [{ specs: { memoryType: 'DDR5', modules: 2, capacityPerModule: 16 } }] // 32GB
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(true);
    });
  });

  describe('Rule 5: Form Factor in Case', () => {
    it('should fail if case does not support motherboard form factor', () => {
      const build = {
        motherboard: { specs: { formFactor: 'E-ATX' } },
        case: { specs: { formFactorsSupported: ['ATX', 'Micro ATX'] } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'INCOMPATIBLE_FORM_FACTOR' }));
    });
    
    it('should pass if case supports form factor', () => {
      const build = {
        motherboard: { specs: { formFactor: 'ATX' } },
        case: { specs: { formFactorsSupported: ['ATX', 'Micro ATX'] } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(true);
    });
  });

  describe('Rule 6: GPU Length Clearance', () => {
    it('should fail if GPU is too long', () => {
      const build = {
        gpu: { specs: { lengthMm: 320 } },
        case: { specs: { maxGpuLengthMm: 300 } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'GPU_CLEARANCE_ERROR' }));
    });
  });

  describe('Rule 7: Cooler Clearance / Radiator Support', () => {
    it('should fail if air cooler is too tall', () => {
      const build = {
        cooler: { specs: { type: 'air', heightMm: 165 } },
        case: { specs: { maxCoolerHeightMm: 160 } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'COOLER_CLEARANCE_ERROR' }));
    });

    it('should fail if case does not support AIO radiator size', () => {
      const build = {
        cooler: { specs: { type: 'AIO', radiatorSizeMm: 360 } },
        case: { specs: { radiatorSupport: [240, 280] } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'RADIATOR_SUPPORT_ERROR' }));
    });
  });

  describe('Rule 8: Cooler Supported Sockets', () => {
    it('should fail if cooler does not support CPU socket', () => {
      const build = {
        cpu: { specs: { socket: 'AM5' } },
        cooler: { specs: { supportedSockets: ['LGA1700', 'AM4'] } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'COOLER_SOCKET_ERROR' }));
    });
  });

  describe('Rule 9: Storage Connections', () => {
    it('should fail if too many M.2 drives', () => {
      const build = {
        motherboard: { specs: { m2Slots: 1, sataConnectors: 4 } },
        storage: [
          { specs: { interface: 'NVMe' } },
          { specs: { interface: 'M.2' } }
        ]
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'M2_SLOTS_EXCEEDED' }));
    });

    it('should fail if too many SATA drives', () => {
      const build = {
        motherboard: { specs: { m2Slots: 2, sataConnectors: 1 } },
        storage: [
          { specs: { interface: 'SATA III' } },
          { specs: { interface: 'SATA III' } }
        ]
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'SATA_PORTS_EXCEEDED' }));
    });
  });

  describe('Rule 10: PSU Wattage', () => {
    it('should fail if PSU wattage is lower than estimated wattage', () => {
      const build = {
        cpu: { specs: { tdp: 105 } },
        gpu: { specs: { tdp: 320 } },
        psu: { specs: { wattage: 500 } }
      };
      // Base (150) + CPU (105) + GPU (320) = 575W. PSU is 500W.
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.estimatedWattage).toBe(575);
      expect(res.errors).toContainEqual(expect.objectContaining({ code: 'INSUFFICIENT_WATTAGE' }));
    });

    it('should pass if PSU wattage is sufficient', () => {
      const build = {
        cpu: { specs: { tdp: 105 } },
        gpu: { specs: { tdp: 320 } },
        psu: { specs: { wattage: 750 } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(true);
      expect(res.estimatedWattage).toBe(575);
    });
    
    it('should return info warning if no PSU is selected', () => {
      const build = { cpu: { specs: { tdp: 65 } } };
      const res = validateBuild(build);
      expect(res.info).toContainEqual(expect.objectContaining({ code: 'WATTAGE_ESTIMATION' }));
    });
  });

  describe('Warnings and Scores', () => {
    it('should return warning if no GPU and CPU lacks integrated graphics', () => {
      const build = {
        cpu: { specs: { integratedGraphics: false } }
      };
      const res = validateBuild(build);
      expect(res.warnings).toContainEqual(expect.objectContaining({ code: 'NO_DISPLAY_OUTPUT' }));
    });

    it('should calculate total price using discountPrice if available', () => {
      const build = {
        cpu: { price: 300, discountPrice: 250 },
        gpu: { price: 500 }
      };
      const res = validateBuild(build);
      expect(res.totalPrice).toBe(750);
    });
  });

  describe('Multiple Independent Errors', () => {
    it('should report both socket mismatch and memory type mismatch at the same time', () => {
      const build = {
        cpu: { specs: { socket: 'LGA1700' } },
        motherboard: { specs: { socket: 'AM5', memoryType: 'DDR5' } },
        ram: [{ specs: { memoryType: 'DDR4', modules: 2 } }]
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(false);
      expect(res.errors).toHaveLength(2);
      const codes = res.errors.map(e => e.code);
      expect(codes).toContain('SOCKET_MISMATCH');
      expect(codes).toContain('MEMORY_TYPE_MISMATCH');
    });
  });

  describe('Phase 7 Advisory Extensions', () => {
    it('should generate LOW_PSU_HEADROOM warning when headroom is < 20%', () => {
      const build = {
        cpu: { specs: { tdp: 100 } },
        gpu: { specs: { tdp: 300 } },
        psu: { specs: { wattage: 600 } }
      };
      const res = validateBuild(build);
      expect(res.valid).toBe(true);
      expect(res.warnings).toContainEqual(expect.objectContaining({ code: 'LOW_PSU_HEADROOM' }));
    });

    it('should suggest complete-your-build for missing PSU and cooler', () => {
      const build = {
        cpu: { specs: { integratedGraphics: false } },
        motherboard: { specs: { } }
      };
      const res = validateBuild(build);
      const codes = res.suggestions.map(s => s.type);
      expect(codes).toContain('complete-build');
      expect(res.suggestions.find(s => s.targetComponent === 'psu')).toBeDefined();
      expect(res.suggestions.find(s => s.targetComponent === 'storage')).toBeDefined();
      expect(res.suggestions.find(s => s.targetComponent === 'cooler')).toBeDefined();
    });

    it('should trigger thermal sanity warning for high-TDP CPU with small air cooler', () => {
      const build = {
        cpu: { specs: { tdp: 120 } },
        cooler: { specs: { type: 'air', heightMm: 140 } }
      };
      const res = validateBuild(build);
      expect(res.warnings).toContainEqual(expect.objectContaining({ code: 'THERMAL_WARNING' }));
    });

    it('should trigger memory speed and single-channel warnings', () => {
      const build = {
        cpu: { specs: { maxMemorySpeed: 5200 } },
        ram: [{ specs: { speed: 6000, modules: 1 } }]
      };
      const res = validateBuild(build);
      expect(res.info).toContainEqual(expect.objectContaining({ code: 'SINGLE_CHANNEL_MEMORY' }));
      expect(res.warnings).toContainEqual(expect.objectContaining({ code: 'MEMORY_SPEED_EXCEEDS_CPU' }));
    });

    it('should detect CPU bottleneck at 1080p', () => {
      const build = {
        cpu: { specs: { performanceScore: 40 } },
        gpu: { specs: { performanceScore: 100 } }
      };
      const res = validateBuild(build, { resolution: '1080p' });
      expect(res.bottleneck.component).toBe('cpu');
      expect(res.warnings).toContainEqual(expect.objectContaining({ code: 'CPU_BOTTLENECK' }));
      expect(res.performanceEstimate.esports).toBeDefined();
    });

    it('should detect GPU bottleneck at 4K', () => {
      const build = {
        cpu: { specs: { performanceScore: 100 } },
        gpu: { specs: { performanceScore: 40 } }
      };
      const res = validateBuild(build, { resolution: '4K' });
      expect(res.bottleneck.component).toBe('gpu');
      expect(res.warnings).toContainEqual(expect.objectContaining({ code: 'GPU_BOTTLENECK' }));
    });

    it('should provide fix-it suggestion with valid catalog', () => {
      const catalog = {
        psu: [
          { id: 'psu-1', name: '750W Gold', specs: { wattage: 750 } },
          { id: 'psu-2', name: '1000W Gold', specs: { wattage: 1000 } }
        ]
      };
      const build = {
        cpu: { specs: { tdp: 100 } },
        gpu: { specs: { tdp: 300 } },
        psu: { specs: { wattage: 500 } }
      };
      const res = validateBuild(build, { catalog });
      expect(res.valid).toBe(false);
      const fixIt = res.suggestions.find(s => s.type === 'fix-it' && s.targetComponent === 'psu');
      expect(fixIt).toBeDefined();
      expect(fixIt.replacementProductId).toBe('psu-2');
    });

    it('should provide smart-alternative suggestion', () => {
      const catalog = {
        gpu: [
          { id: 'gpu-1', name: 'RTX 4070', price: 600, specs: { performanceScore: 80 } },
          { id: 'gpu-2', name: 'RTX 4070 Super', price: 630, specs: { performanceScore: 88 } }
        ]
      };
      const build = {
        gpu: { price: 600, specs: { performanceScore: 80 } }
      };
      const res = validateBuild(build, { catalog });
      const smart = res.suggestions.find(s => s.type === 'smart-alternative');
      expect(smart).toBeDefined();
      expect(smart.replacementProductId).toBe('gpu-2');
    });
  });
});
