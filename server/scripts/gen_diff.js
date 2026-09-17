require('dotenv').config();
const { execSync } = require('child_process');

try {
  const sql = execSync(`npx prisma migrate diff --from-url "${process.env.DATABASE_URL}" --to-schema-datamodel prisma/schema.prisma --script`, {
    encoding: 'utf8',
  });
  console.log('--- GENERATED SQL ---');
  console.log(sql);
} catch (err) {
  console.error('Error generating diff:', err.stdout || err.message);
}
