const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  const admins = await prisma.adminUser.findMany({
    select: { id: true },
  });

  const wallets = await prisma.adminWallet.findMany({
    select: { admin_user_id: true },
  });

  const hasWallet = new Set(
    wallets.map((item) => item.admin_user_id.toString()),
  );
  const missing = admins
    .filter((item) => !hasWallet.has(item.id.toString()))
    .map((item) => ({
      admin_user_id: item.id,
      account_number: `ADM${item.id.toString().padStart(10, "0")}`,
      amount: 0,
    }));

  if (missing.length > 0) {
    await prisma.adminWallet.createMany({
      data: missing,
      skipDuplicates: true,
    });
  }

  const totalAdmins = await prisma.adminUser.count();
  const totalWallets = await prisma.adminWallet.count();

  console.log(
    JSON.stringify(
      {
        inserted: missing.length,
        totalAdmins,
        totalWallets,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
