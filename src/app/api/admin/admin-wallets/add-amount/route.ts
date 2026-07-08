import { z } from "zod";

import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const schema = z.object({
  admin_user_id: z.coerce.bigint(),
  amount: z.coerce.number().min(1),
  description: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);
  if (!isSuperAdmin(admin)) {
    return errorResponse("Forbidden. Super admin only.", {}, 403);
  }

  try {
    const payload = schema.parse(await req.json());

    const adminUser = await prisma.adminUser.findUnique({
      where: { id: payload.admin_user_id },
    });
    if (!adminUser) return errorResponse("Admin user not found.", {}, 404);

    const wallet = await prisma.adminWallet.upsert({
      where: { admin_user_id: payload.admin_user_id },
      create: {
        admin_user_id: payload.admin_user_id,
        account_number: `ADM${payload.admin_user_id.toString().padStart(10, "0")}`,
        amount: 0,
      },
      update: {},
    });

    const updated = await prisma.adminWallet.update({
      where: { id: wallet.id },
      data: {
        amount: { increment: payload.amount },
        updated_at: new Date(),
      },
    });

    return successResponse("Admin wallet amount added successfully.", {
      id: updated.id.toString(),
      admin_user_id: updated.admin_user_id.toString(),
      amount: Number(updated.amount).toFixed(2),
      description: payload.description || "",
    });
  } catch (error) {
    return errorResponse("Validation failed.", error, 422);
  }
}
