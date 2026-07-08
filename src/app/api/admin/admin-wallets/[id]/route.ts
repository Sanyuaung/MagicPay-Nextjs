import { z } from "zod";

import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const updateSchema = z.object({
  account_number: z.string().trim().min(1).optional(),
});

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);
  if (!isSuperAdmin(admin)) {
    return errorResponse("Forbidden. Super admin only.", {}, 403);
  }

  const { id } = await context.params;

  const item = await prisma.adminWallet.findUnique({
    where: { id: BigInt(id) },
    include: { admin_user: true },
  });

  if (!item) return errorResponse("Admin wallet not found.", {}, 404);

  return successResponse("Admin wallet", {
    id: item.id.toString(),
    admin_user_id: item.admin_user_id.toString(),
    account_number: item.account_number,
    amount: Number(item.amount).toFixed(2),
    created_at: item.created_at,
    updated_at: item.updated_at,
    admin_user: {
      id: item.admin_user.id.toString(),
      name: item.admin_user.name,
      email: item.admin_user.email,
      phone: item.admin_user.phone,
    },
  });
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);
  if (!isSuperAdmin(admin)) {
    return errorResponse("Forbidden. Super admin only.", {}, 403);
  }

  const { id } = await context.params;

  try {
    const payload = updateSchema.parse(await req.json());

    const updated = await prisma.adminWallet.update({
      where: { id: BigInt(id) },
      data: {
        ...(payload.account_number
          ? { account_number: payload.account_number }
          : {}),
        updated_at: new Date(),
      },
    });

    return successResponse("Admin wallet updated successfully.", {
      id: updated.id.toString(),
      admin_user_id: updated.admin_user_id.toString(),
      account_number: updated.account_number,
      amount: Number(updated.amount).toFixed(2),
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    });
  } catch (error) {
    return errorResponse("Validation failed.", error, 422);
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);
  if (!isSuperAdmin(admin)) {
    return errorResponse("Forbidden. Super admin only.", {}, 403);
  }

  const { id } = await context.params;
  await prisma.adminWallet.delete({ where: { id: BigInt(id) } });

  return successResponse("Admin wallet deleted successfully.", []);
}
