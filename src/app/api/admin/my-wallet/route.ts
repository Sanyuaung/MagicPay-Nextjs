import { getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);

  const wallet = await prisma.adminWallet.upsert({
    where: { admin_user_id: admin.id },
    create: {
      admin_user_id: admin.id,
      account_number: `ADM${admin.id.toString().padStart(10, "0")}`,
      amount: 0,
    },
    update: {},
  });

  return successResponse("My wallet", {
    admin_user_id: admin.id.toString(),
    admin_role: admin.role,
    linked_user: true,
    account_person: admin.name,
    account_number: wallet.account_number,
    amount: Number(wallet.amount).toFixed(2),
    updated_at: wallet.updated_at,
  });
}
