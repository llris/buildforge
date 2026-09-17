require('dotenv').config();
const prisma = require('../utils/prisma');

async function main() {
  const reviews = await prisma.review.findMany();
  console.log(`Total reviews in DB: ${reviews.length}`);

  const seen = new Map();
  const duplicates = [];

  for (const r of reviews) {
    const key = `${r.userId}:${r.productId}`;
    if (seen.has(key)) {
      duplicates.push({ duplicateId: r.id, originalId: seen.get(key), userId: r.userId, productId: r.productId });
    } else {
      seen.set(key, r.id);
    }
  }

  console.log(`Found ${duplicates.length} duplicate review(s).`);

  if (duplicates.length > 0) {
    console.log('Duplicates detail:', JSON.stringify(duplicates, null, 2));
    for (const dup of duplicates) {
      console.log(`Deleting duplicate review id=${dup.duplicateId}`);
      await prisma.review.delete({ where: { id: dup.duplicateId } });
    }
    console.log('Duplicate reviews cleaned up successfully.');
  } else {
    console.log('No duplicate reviews found.');
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
