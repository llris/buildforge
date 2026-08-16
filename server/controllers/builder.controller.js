
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validateBuild } = require('../services/advisor/compatibility.service');
const AppError = require('../utils/AppError');

// Helper to fetch a product by ID, including its specs and discountPrice
const getProduct = async (id) => {
  if (!id) return null;
  return await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      brand: true,
      price: true,
      discountPrice: true,
      specs: true,
      images: true,
      slug: true,
      category: {
        select: { name: true, slug: true }
      }
    }
  });
};

exports.validate = async (req, res, next) => {
  try {
    const { resolution = '1440p', ...componentIds } = req.body;
    
    const getVal = (key) => componentIds[key] || componentIds[key.toUpperCase()] || componentIds[key.charAt(0).toUpperCase() + key.slice(1)];
    
    const [cpu, motherboard, gpu, pcCase, psu, cooler] = await Promise.all([
      getProduct(getVal('cpu')),
      getProduct(getVal('motherboard')),
      getProduct(getVal('gpu')),
      getProduct(getVal('case') || getVal('pcCase')),
      getProduct(getVal('psu')),
      getProduct(getVal('cooler'))
    ]);
    
    let ram = [];
    const ramVal = getVal('ram');
    if (ramVal) {
      const ramIds = Array.isArray(ramVal) ? ramVal : [ramVal];
      ram = await Promise.all(ramIds.map(id => getProduct(id)));
    }
    
    let storage = [];
    const storageVal = getVal('storage');
    if (storageVal) {
      const storageIds = Array.isArray(storageVal) ? storageVal : [storageVal];
      storage = await Promise.all(storageIds.map(id => getProduct(id)));
    }

    const buildObj = {
      cpu,
      motherboard,
      ram: ram.filter(Boolean),
      gpu,
      case: pcCase,
      psu,
      storage: storage.filter(Boolean),
      cooler
    };

    // Fetch catalog for suggestions
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { slug: true } } }
    });
    
    const catalog = {};
    allProducts.forEach(p => {
      const cat = p.category?.slug;
      if (cat) {
        if (!catalog[cat]) catalog[cat] = [];
        catalog[cat].push({
          id: p.id,
          name: p.name,
          price: p.price,
          discountPrice: p.discountPrice,
          specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs
        });
      }
    });

    const result = validateBuild(buildObj, { resolution, catalog });
    
    res.status(200).json({
      status: 'success',
      data: {
        validation: result,
        populatedBuild: buildObj
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getComponents = async (req, res, next) => {
  try {
    const { type } = req.params;
    let categorySlug = type.toLowerCase();
    
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });
    
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const products = await prisma.product.findMany({
      where: { categoryId: category.id, isActive: true },
      select: {
        id: true,
        name: true,
        brand: true,
        price: true,
        discountPrice: true,
        specs: true,
        images: true,
        slug: true
      }
    });

    res.status(200).json({ status: 'success', data: products });
  } catch (err) {
    next(err);
  }
};

// Greedy auto-build algorithm
exports.autoBuild = async (req, res, next) => {
  try {
    const { budget = 1000, useCase = 'gaming', resolution = '1440p' } = req.body;
    
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { slug: true } } }
    });
    
    const catalog = {};
    products.forEach(p => {
      const cat = p.category?.slug;
      if (cat) {
        if (!catalog[cat]) catalog[cat] = [];
        const item = {
          id: p.id,
          name: p.name,
          price: p.discountPrice || p.price,
          specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs,
          images: p.images,
          brand: p.brand,
          slug: p.slug
        };
        catalog[cat].push(item);
      }
    });
    
    Object.keys(catalog).forEach(cat => {
      // sort by performance/price descending generally
      catalog[cat].sort((a, b) => b.price - a.price);
    });

    // Strategy for greedy picking:
    let gpu = null;
    let cpu = null;
    let motherboard = null;
    let ram = null;
    let storage = null;
    let psu = null;
    let pcCase = null;
    let cooler = null;
    
    let rem = budget;
    
    // 1. GPU (~45% budget for gaming)
    if (useCase !== 'office') {
      const gpuBudget = useCase === 'gaming' ? budget * 0.45 : budget * 0.25;
      gpu = catalog['gpu']?.find(g => g.price <= gpuBudget) || catalog['gpu']?.reverse().find(g => g.price <= budget * 0.6); // fallback to cheapest if none under budget
      if (gpu) rem -= gpu.price;
    }

    // 2. CPU (~25% budget)
    const cpuBudget = useCase === 'workstation' ? budget * 0.4 : budget * 0.25;
    cpu = catalog['cpu']?.find(c => c.price <= cpuBudget) || catalog['cpu']?.[catalog['cpu'].length - 1]; // fallback to cheapest
    if (cpu) rem -= cpu.price;

    // 3. Motherboard (matches CPU)
    motherboard = catalog['motherboard']?.slice().reverse().find(m => m.specs?.socket === cpu?.specs?.socket);
    if (motherboard) rem -= motherboard.price;

    // 4. RAM (matches Mobo)
    ram = catalog['ram']?.find(r => r.specs?.memoryType === motherboard?.specs?.memoryType && r.price <= Math.max(100, rem * 0.3)) || catalog['ram']?.slice().reverse().find(r => r.specs?.memoryType === motherboard?.specs?.memoryType);
    if (ram) rem -= ram.price;

    // 5. Storage
    storage = catalog['storage']?.find(s => s.price <= Math.max(80, rem * 0.3)) || catalog['storage']?.[catalog['storage'].length - 1];
    if (storage) rem -= storage.price;

    // 6. Case
    pcCase = catalog['case']?.find(c => c.price <= Math.max(80, rem * 0.4) && c.specs?.formFactorsSupported?.includes(motherboard?.specs?.formFactor) && (!gpu || Number(c.specs?.maxGpuLengthMm || 999) >= Number(gpu.specs?.lengthMm || 0))) || catalog['case']?.[catalog['case'].length - 1];
    if (pcCase) rem -= pcCase.price;

    // 7. PSU (calculated wattage)
    let estWattage = 150 + Number(cpu?.specs?.tdp || 0) + Number(gpu?.specs?.tdp || 0);
    let targetWattage = estWattage / 0.6;
    psu = catalog['psu']?.slice().reverse().find(p => Number(p.specs?.wattage || 0) >= targetWattage);
    if (!psu) psu = catalog['psu']?.[0]; // just grab biggest
    if (psu) rem -= psu.price;

    // 8. Cooler
    if (cpu && pcCase) {
      cooler = catalog['cooler']?.slice().reverse().find(c => c.specs?.supportedSockets?.includes(cpu.specs.socket) && (c.specs.type === 'Air' ? Number(c.specs.heightMm || 0) <= Number(pcCase.specs?.maxCoolerHeightMm || 999) : true));
    }

    const buildObj = {
      cpu, motherboard, ram: ram ? [ram] : [], gpu, case: pcCase, psu, storage: storage ? [storage] : [], cooler
    };
    
    const validation = validateBuild(buildObj, { resolution, catalog });

    res.status(200).json({
      status: 'success',
      data: {
        validation,
        populatedBuild: buildObj
      }
    });
  } catch (err) {
    next(err);
  }
};
