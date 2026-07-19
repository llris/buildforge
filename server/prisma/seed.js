const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.buildShare.deleteMany();
  await prisma.savedBuild.deleteMany();
  await prisma.productAnswer.deleteMany();
  await prisma.productQuestion.deleteMany();
  await prisma.review.deleteMany();
  await prisma.return.deleteMany();
  await prisma.stockReservation.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shippingZone.deleteMany();
  await prisma.taxRule.deleteMany();

  // 1. Users
  const admin = await prisma.user.create({ data: { email: 'admin@buildforge.com', passwordHash: 'hash', role: 'ADMIN', isEmailVerified: true } });
  const support = await prisma.user.create({ data: { email: 'support@buildforge.com', passwordHash: 'hash', role: 'SUPPORT', isEmailVerified: true } });
  const cust1 = await prisma.user.create({ data: { email: 'cust1@example.com', passwordHash: 'hash', role: 'CUSTOMER' } });
  const cust2 = await prisma.user.create({ data: { email: 'cust2@example.com', passwordHash: 'hash', role: 'CUSTOMER' } });
  const cust3 = await prisma.user.create({ data: { email: 'cust3@example.com', passwordHash: 'hash', role: 'CUSTOMER' } });

  // 2. Categories
  const catNames = ['CPU', 'Motherboard', 'RAM', 'GPU', 'Storage', 'PSU', 'Case', 'Cooler', 'Peripherals', 'Prebuilt'];
  const cats = {};
  for (const name of catNames) {
    cats[name] = await prisma.category.create({ data: { name, slug: name.toLowerCase() } });
  }

  // 3. Products
  const productsToCreate = [
    // CPUs (6)
    { name: 'AMD Ryzen 5 7600X', slug: 'amd-ryzen-5-7600x', brand: 'AMD', price: 229, categoryId: cats.CPU.id, specs: { socket: 'AM5', tdp: 105, coreCount: 6, maxMemorySpeed: 5200, integratedGraphics: true, performanceScore: 75 } },
    { name: 'AMD Ryzen 7 7700X', slug: 'amd-ryzen-7-7700x', brand: 'AMD', price: 349, categoryId: cats.CPU.id, specs: { socket: 'AM5', tdp: 105, coreCount: 8, maxMemorySpeed: 5200, integratedGraphics: true, performanceScore: 85 } },
    { name: 'AMD Ryzen 9 7950X', slug: 'amd-ryzen-9-7950x', brand: 'AMD', price: 599, categoryId: cats.CPU.id, specs: { socket: 'AM5', tdp: 170, coreCount: 16, maxMemorySpeed: 5200, integratedGraphics: true, performanceScore: 98 } },
    { name: 'Intel Core i5-13600K', slug: 'intel-core-i5-13600k', brand: 'Intel', price: 319, categoryId: cats.CPU.id, specs: { socket: 'LGA1700', tdp: 125, coreCount: 14, maxMemorySpeed: 5600, integratedGraphics: true, performanceScore: 80 } },
    { name: 'Intel Core i7-13700K', slug: 'intel-core-i7-13700k', brand: 'Intel', price: 409, categoryId: cats.CPU.id, specs: { socket: 'LGA1700', tdp: 125, coreCount: 16, maxMemorySpeed: 5600, integratedGraphics: true, performanceScore: 90 } },
    { name: 'Intel Core i9-13900K', slug: 'intel-core-i9-13900k', brand: 'Intel', price: 589, categoryId: cats.CPU.id, specs: { socket: 'LGA1700', tdp: 125, coreCount: 24, maxMemorySpeed: 5600, integratedGraphics: true, performanceScore: 99 } },

    // Motherboards (6)
    { name: 'ASUS ROG Strix B650E-F', slug: 'asus-rog-strix-b650e-f', brand: 'ASUS', price: 259, categoryId: cats.Motherboard.id, specs: { socket: 'AM5', chipset: 'B650E', formFactor: 'ATX', memoryType: 'DDR5', memorySlots: 4, maxMemory: 128, m2Slots: 3, sataConnectors: 4 } },
    { name: 'MSI MAG B650 TOMAHAWK', slug: 'msi-mag-b650-tomahawk', brand: 'MSI', price: 219, categoryId: cats.Motherboard.id, specs: { socket: 'AM5', chipset: 'B650', formFactor: 'ATX', memoryType: 'DDR5', memorySlots: 4, maxMemory: 128, m2Slots: 3, sataConnectors: 6 } },
    { name: 'Gigabyte X670 AORUS ELITE AX', slug: 'gigabyte-x670-aorus-elite-ax', brand: 'Gigabyte', price: 289, categoryId: cats.Motherboard.id, specs: { socket: 'AM5', chipset: 'X670', formFactor: 'ATX', memoryType: 'DDR5', memorySlots: 4, maxMemory: 128, m2Slots: 4, sataConnectors: 4 } },
    { name: 'ASUS PRIME Z790-P', slug: 'asus-prime-z790-p', brand: 'ASUS', price: 239, categoryId: cats.Motherboard.id, specs: { socket: 'LGA1700', chipset: 'Z790', formFactor: 'ATX', memoryType: 'DDR5', memorySlots: 4, maxMemory: 128, m2Slots: 3, sataConnectors: 4 } },
    { name: 'MSI PRO Z790-A', slug: 'msi-pro-z790-a', brand: 'MSI', price: 259, categoryId: cats.Motherboard.id, specs: { socket: 'LGA1700', chipset: 'Z790', formFactor: 'ATX', memoryType: 'DDR5', memorySlots: 4, maxMemory: 128, m2Slots: 4, sataConnectors: 6 } },
    { name: 'Gigabyte B760M DS3H', slug: 'gigabyte-b760m-ds3h', brand: 'Gigabyte', price: 119, categoryId: cats.Motherboard.id, specs: { socket: 'LGA1700', chipset: 'B760', formFactor: 'Micro ATX', memoryType: 'DDR4', memorySlots: 4, maxMemory: 128, m2Slots: 2, sataConnectors: 4 } },

    // RAM (6)
    { name: 'Corsair Vengeance 32GB (2x16GB) DDR5-6000', slug: 'corsair-vengeance-32gb-ddr5-6000', brand: 'Corsair', price: 114, categoryId: cats.RAM.id, specs: { memoryType: 'DDR5', speed: 6000, modules: 2, capacityPerModule: 16 } },
    { name: 'G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5-6400', slug: 'gskill-trident-z5-rgb-32gb-ddr5-6400', brand: 'G.Skill', price: 129, categoryId: cats.RAM.id, specs: { memoryType: 'DDR5', speed: 6400, modules: 2, capacityPerModule: 16 } },
    { name: 'Kingston FURY Beast 16GB (2x8GB) DDR5-5200', slug: 'kingston-fury-beast-16gb-ddr5-5200', brand: 'Kingston', price: 69, categoryId: cats.RAM.id, specs: { memoryType: 'DDR5', speed: 5200, modules: 2, capacityPerModule: 8 } },
    { name: 'Corsair Vengeance LPX 16GB (2x8GB) DDR4-3200', slug: 'corsair-vengeance-lpx-16gb-ddr4-3200', brand: 'Corsair', price: 44, categoryId: cats.RAM.id, specs: { memoryType: 'DDR4', speed: 3200, modules: 2, capacityPerModule: 8 } },
    { name: 'G.Skill Ripjaws V 32GB (2x16GB) DDR4-3600', slug: 'gskill-ripjaws-v-32gb-ddr4-3600', brand: 'G.Skill', price: 74, categoryId: cats.RAM.id, specs: { memoryType: 'DDR4', speed: 3600, modules: 2, capacityPerModule: 16 } },
    { name: 'Crucial Pro 64GB (2x32GB) DDR5-5600', slug: 'crucial-pro-64gb-ddr5-5600', brand: 'Crucial', price: 189, categoryId: cats.RAM.id, specs: { memoryType: 'DDR5', speed: 5600, modules: 2, capacityPerModule: 32 } },

    // GPUs (6)
    { name: 'NVIDIA GeForce RTX 4090', slug: 'nvidia-geforce-rtx-4090', brand: 'NVIDIA', price: 1599, categoryId: cats.GPU.id, specs: { lengthMm: 304, tdp: 450, recommendedPsuWattage: 850, vramGb: 24, performanceScore: 100 } },
    { name: 'NVIDIA GeForce RTX 4080', slug: 'nvidia-geforce-rtx-4080', brand: 'NVIDIA', price: 1199, categoryId: cats.GPU.id, specs: { lengthMm: 304, tdp: 320, recommendedPsuWattage: 750, vramGb: 16, performanceScore: 92 } },
    { name: 'NVIDIA GeForce RTX 4070 Ti', slug: 'nvidia-geforce-rtx-4070-ti', brand: 'NVIDIA', price: 799, categoryId: cats.GPU.id, specs: { lengthMm: 285, tdp: 285, recommendedPsuWattage: 700, vramGb: 12, performanceScore: 85 } },
    { name: 'NVIDIA GeForce RTX 4070', slug: 'nvidia-geforce-rtx-4070', brand: 'NVIDIA', price: 599, categoryId: cats.GPU.id, specs: { lengthMm: 244, tdp: 200, recommendedPsuWattage: 650, vramGb: 12, performanceScore: 78 } },
    { name: 'AMD Radeon RX 7900 XTX', slug: 'amd-radeon-rx-7900-xtx', brand: 'AMD', price: 999, categoryId: cats.GPU.id, specs: { lengthMm: 287, tdp: 355, recommendedPsuWattage: 800, vramGb: 24, performanceScore: 94 } },
    { name: 'AMD Radeon RX 7800 XT', slug: 'amd-radeon-rx-7800-xt', brand: 'AMD', price: 499, categoryId: cats.GPU.id, specs: { lengthMm: 267, tdp: 263, recommendedPsuWattage: 700, vramGb: 16, performanceScore: 82 } },

    // Storage (6)
    { name: 'Samsung 990 PRO 2TB', slug: 'samsung-990-pro-2tb', brand: 'Samsung', price: 169, categoryId: cats.Storage.id, specs: { interface: 'M.2 NVMe', capacityGb: 2000, formFactor: 'M.2 2280' } },
    { name: 'Samsung 980 PRO 1TB', slug: 'samsung-980-pro-1tb', brand: 'Samsung', price: 89, categoryId: cats.Storage.id, specs: { interface: 'M.2 NVMe', capacityGb: 1000, formFactor: 'M.2 2280' } },
    { name: 'Crucial P3 Plus 2TB', slug: 'crucial-p3-plus-2tb', brand: 'Crucial', price: 119, categoryId: cats.Storage.id, specs: { interface: 'M.2 NVMe', capacityGb: 2000, formFactor: 'M.2 2280' } },
    { name: 'WD Black SN850X 2TB', slug: 'wd-black-sn850x-2tb', brand: 'Western Digital', price: 159, categoryId: cats.Storage.id, specs: { interface: 'M.2 NVMe', capacityGb: 2000, formFactor: 'M.2 2280' } },
    { name: 'Samsung 870 EVO 1TB', slug: 'samsung-870-evo-1tb', brand: 'Samsung', price: 79, categoryId: cats.Storage.id, specs: { interface: 'SATA', capacityGb: 1000, formFactor: '2.5"' } },
    { name: 'Seagate Barracuda 2TB', slug: 'seagate-barracuda-2tb', brand: 'Seagate', price: 54, categoryId: cats.Storage.id, specs: { interface: 'SATA', capacityGb: 2000, formFactor: '3.5"' } },

    // PSU (6)
    { name: 'Corsair RM850x (2021)', slug: 'corsair-rm850x-2021', brand: 'Corsair', price: 149, categoryId: cats.PSU.id, specs: { wattage: 850, formFactor: 'ATX', efficiencyRating: '80+ Gold', modular: 'Full' } },
    { name: 'Corsair RM750e (2023)', slug: 'corsair-rm750e-2023', brand: 'Corsair', price: 99, categoryId: cats.PSU.id, specs: { wattage: 750, formFactor: 'ATX', efficiencyRating: '80+ Gold', modular: 'Full' } },
    { name: 'EVGA SuperNOVA 850 G6', slug: 'evga-supernova-850-g6', brand: 'EVGA', price: 139, categoryId: cats.PSU.id, specs: { wattage: 850, formFactor: 'ATX', efficiencyRating: '80+ Gold', modular: 'Full' } },
    { name: 'Seasonic FOCUS GX-1000', slug: 'seasonic-focus-gx-1000', brand: 'Seasonic', price: 179, categoryId: cats.PSU.id, specs: { wattage: 1000, formFactor: 'ATX', efficiencyRating: '80+ Gold', modular: 'Full' } },
    { name: 'Thermaltake Toughpower GF1 850W', slug: 'thermaltake-toughpower-gf1-850w', brand: 'Thermaltake', price: 119, categoryId: cats.PSU.id, specs: { wattage: 850, formFactor: 'ATX', efficiencyRating: '80+ Gold', modular: 'Full' } },
    { name: 'Cooler Master MWE Gold 850 V2', slug: 'cooler-master-mwe-gold-850-v2', brand: 'Cooler Master', price: 109, categoryId: cats.PSU.id, specs: { wattage: 850, formFactor: 'ATX', efficiencyRating: '80+ Gold', modular: 'Full' } },

    // Case (6)
    { name: 'Corsair 4000D Airflow', slug: 'corsair-4000d-airflow', brand: 'Corsair', price: 104, categoryId: cats.Case.id, specs: { formFactorsSupported: ['ATX', 'Micro ATX', 'Mini ITX'], maxGpuLengthMm: 360, maxCoolerHeightMm: 170, radiatorSupport: [240, 280, 360] } },
    { name: 'Lian Li PC-O11 Dynamic', slug: 'lian-li-pc-o11-dynamic', brand: 'Lian Li', price: 149, categoryId: cats.Case.id, specs: { formFactorsSupported: ['ATX', 'Micro ATX', 'Mini ITX', 'E-ATX'], maxGpuLengthMm: 420, maxCoolerHeightMm: 155, radiatorSupport: [240, 280, 360] } },
    { name: 'NZXT H5 Flow', slug: 'nzxt-h5-flow', brand: 'NZXT', price: 94, categoryId: cats.Case.id, specs: { formFactorsSupported: ['ATX', 'Micro ATX', 'Mini ITX'], maxGpuLengthMm: 365, maxCoolerHeightMm: 165, radiatorSupport: [240, 280] } },
    { name: 'Fractal Design North', slug: 'fractal-design-north', brand: 'Fractal Design', price: 139, categoryId: cats.Case.id, specs: { formFactorsSupported: ['ATX', 'Micro ATX', 'Mini ITX'], maxGpuLengthMm: 355, maxCoolerHeightMm: 170, radiatorSupport: [240, 280, 360] } },
    { name: 'Phanteks Eclipse G360A', slug: 'phanteks-eclipse-g360a', brand: 'Phanteks', price: 99, categoryId: cats.Case.id, specs: { formFactorsSupported: ['ATX', 'Micro ATX', 'Mini ITX', 'E-ATX'], maxGpuLengthMm: 400, maxCoolerHeightMm: 162, radiatorSupport: [240, 280, 360] } },
    { name: 'Corsair 5000D Airflow', slug: 'corsair-5000d-airflow', brand: 'Corsair', price: 164, categoryId: cats.Case.id, specs: { formFactorsSupported: ['ATX', 'Micro ATX', 'Mini ITX', 'E-ATX'], maxGpuLengthMm: 400, maxCoolerHeightMm: 170, radiatorSupport: [240, 280, 360] } },

    // Cooler (6)
    { name: 'Noctua NH-D15', slug: 'noctua-nh-d15', brand: 'Noctua', price: 109, categoryId: cats.Cooler.id, specs: { type: 'Air', heightMm: 165, radiatorSizeMm: 0, supportedSockets: ['AM4', 'AM5', 'LGA1700'] } },
    { name: 'Thermalright Peerless Assassin 120', slug: 'thermalright-peerless-assassin-120', brand: 'Thermalright', price: 34, categoryId: cats.Cooler.id, specs: { type: 'Air', heightMm: 157, radiatorSizeMm: 0, supportedSockets: ['AM4', 'AM5', 'LGA1700'] } },
    { name: 'Corsair iCUE H150i ELITE CAPELLIX XT', slug: 'corsair-icue-h150i-elite-capellix-xt', brand: 'Corsair', price: 219, categoryId: cats.Cooler.id, specs: { type: 'AIO', heightMm: 0, radiatorSizeMm: 360, supportedSockets: ['AM4', 'AM5', 'LGA1700'] } },
    { name: 'NZXT Kraken 240', slug: 'nzxt-kraken-240', brand: 'NZXT', price: 139, categoryId: cats.Cooler.id, specs: { type: 'AIO', heightMm: 0, radiatorSizeMm: 240, supportedSockets: ['AM4', 'AM5', 'LGA1700'] } },
    { name: 'DeepCool AK620', slug: 'deepcool-ak620', brand: 'DeepCool', price: 64, categoryId: cats.Cooler.id, specs: { type: 'Air', heightMm: 160, radiatorSizeMm: 0, supportedSockets: ['AM4', 'AM5', 'LGA1700'] } },
    { name: 'ARCTIC Liquid Freezer II 280', slug: 'arctic-liquid-freezer-ii-280', brand: 'ARCTIC', price: 114, categoryId: cats.Cooler.id, specs: { type: 'AIO', heightMm: 0, radiatorSizeMm: 280, supportedSockets: ['AM4', 'AM5', 'LGA1700'] } },
  ];

  const products = [];
  for (const p of productsToCreate) {
    const prod = await prisma.product.create({ data: { ...p, images: [] } });
    products.push(prod);
    await prisma.inventory.create({ data: { productId: prod.id, stockQty: 50, reservedQty: 0 } });
  }

  // 4. E-commerce settings
  await prisma.coupon.create({ data: { code: 'WELCOME10', discountPercent: 10 } });
  await prisma.coupon.create({ data: { code: 'SUMMER20', discountPercent: 20 } });
  await prisma.shippingZone.create({ data: { region: 'US', fee: 15.00, estimatedDays: 3 } });
  await prisma.taxRule.create({ data: { region: 'US', ratePercent: 7.5 } });

  // Helper to find product by partial slug
  const findP = (slug) => products.find(p => p.slug.includes(slug));

  // 5. Saved Builds
  
  // Valid Build: AM5, 7700X, RTX 4070, B650, DDR5, 850W, ATX Case, AIO Cooler
  const validComponents = {
    CPU: findP('7700x').id,
    Motherboard: findP('rog-strix-b650e').id,
    RAM: findP('ddr5-6000').id,
    GPU: findP('rtx-4070-ti').id, 
    Storage: findP('990-pro').id,
    PSU: findP('rm850x').id,
    Case: findP('4000d').id,
    Cooler: findP('kraken-240').id,
  };
  
  await prisma.savedBuild.create({
    data: {
      userId: cust1.id,
      name: 'High-End 1440p AM5 Build',
      components: validComponents,
      totalPrice: 2000.0,
      buildScore: 89,
    }
  });

  // Broken Build: Intel CPU (13600K) on AM5 Motherboard (B650)
  const brokenComponents = {
    CPU: findP('13600k').id, // LGA1700
    Motherboard: findP('msi-mag-b650').id, // AM5
    RAM: findP('ddr4-3200').id, // DDR4 (B650 needs DDR5)
    GPU: findP('rtx-4070').id,
    Storage: findP('870-evo').id,
    PSU: findP('rm750e').id,
    Case: findP('4000d').id,
    Cooler: findP('peerless-assassin').id,
  };

  await prisma.savedBuild.create({
    data: {
      userId: cust2.id,
      name: 'Intentionally Broken Build',
      components: brokenComponents,
      totalPrice: 1500.0,
      buildScore: 0,
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
