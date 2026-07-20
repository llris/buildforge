const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testJsonFilter() {
  console.log('Testing JSON filter for socket=AM5...');
  try {
    const products = await prisma.product.findMany({
      where: {
        AND: [
          {
            specs: {
              path: ['socket'],
              equals: 'AM5'
            }
          }
        ]
      },
      select: {
        name: true,
        specs: true
      }
    });
    console.log(`Found ${products.length} products.`);
    console.log(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testJsonFilter();
