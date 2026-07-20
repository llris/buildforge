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
    const componentIds = req.body; // e.g. { cpu: 'id', motherboard: 'id', ram: ['id1', 'id2'] }
    
    const getVal = (key) => componentIds[key] || componentIds[key.toUpperCase()] || componentIds[key.charAt(0).toUpperCase() + key.slice(1)];
    
    // Concurrently fetch all components
    const [cpu, motherboard, gpu, pcCase, psu, cooler] = await Promise.all([
      getProduct(getVal('cpu')),
      getProduct(getVal('motherboard')),
      getProduct(getVal('gpu')),
      getProduct(getVal('case') || getVal('pcCase')),
      getProduct(getVal('psu')),
      getProduct(getVal('cooler'))
    ]);
    
    // Fetch arrays
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

    const result = validateBuild(buildObj);
    
    // Attach the populated component objects for the frontend to render the builder
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
    const { type } = req.params; // 'cpu', 'motherboard', etc.
    // In a real app we'd map type to a categorySlug accurately
    let categorySlug = type.toLowerCase();

    // To implement `?compatibleWith=<partialBuild>` we could parse the partialBuild JSON here, 
    // run logic to add Prisma filters (e.g. if partialBuild has an AM5 motherboard, filter CPUs by socket: AM5).
    // For simplicity in this demo, we'll just return the products for the category.
    // If we wanted to be robust, we'd add `where: { specs: { path: ['socket'], equals: am5 } }`.
    
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });
    
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true
      },
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

    res.status(200).json({
      status: 'success',
      data: products
    });
  } catch (err) {
    next(err);
  }
};
