import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@house9ja.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@House9ja2025!';
const ADMIN_PHONE    = process.env.ADMIN_PHONE    || '+2348000000001';
const ADMIN_FIRST    = process.env.ADMIN_FIRST    || 'Super';
const ADMIN_LAST     = process.env.ADMIN_LAST     || 'Admin';
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`\nAdmin already exists: ${ADMIN_EMAIL} (role: ${existing.role})\n`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.create({
    data: {
      email:         ADMIN_EMAIL,
      phone:         ADMIN_PHONE,
      passwordHash,
      firstName:     ADMIN_FIRST,
      lastName:      ADMIN_LAST,
      role:          'ADMIN',
      isVerified:    true,
      emailVerified: true,
      acceptedTerms: true,
    },
  });

  console.log(`\n✅  Admin created:`);
  console.log(`    ID:    ${admin.id}`);
  console.log(`    Email: ${admin.email}`);
  console.log(`    Role:  ${admin.role}`);
  console.log(`\n    Login at: https://house9ja.com/login\n`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
