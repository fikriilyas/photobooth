import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: npm run db:seed -- <email>');
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: {
      email: email.toLowerCase(),
      role: 'OWNER',
    },
  });

  console.log('User created:', user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
