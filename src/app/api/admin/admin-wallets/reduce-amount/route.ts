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

    const wallet = await prisma.adminWallet.findUnique({
      where: { admin_user_id: payload.admin_user_id },
    });

    if (!wallet) return errorResponse("Admin wallet not found.", {}, 404);
    if (Number(wallet.amount) < payload.amount) {
      return errorResponse("Insufficient balance in admin wallet.", {}, 422);
    }

    const updated = await prisma.adminWallet.update({
      where: { id: wallet.id },
      data: {
        amount: { decrement: payload.amount },
        updated_at: new Date(),
      },
    });

    return successResponse("Admin wallet amount reduced successfully.", {
      id: updated.id.toString(),
      admin_user_id: updated.admin_user_id.toString(),
      amount: Number(updated.amount).toFixed(2),
      description: payload.description || "",
    });
  } catch (error) {
    return errorResponse("Validation failed.", error, 422);
  }
}
