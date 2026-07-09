import { z } from "zod";

import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const schema = z.object({
  review_note: z.string().trim().min(1).max(500),
});

export async function POST(
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
    const payload = schema.parse(await req.json());

    const request = await prisma.adminWalletRequest.findUnique({
      where: { id: BigInt(id) },
    });

    if (!request) return errorResponse("Request not found.", {}, 404);
    if (request.status !== "pending") {
      return errorResponse("Only pending request can be approved.", {}, 422);
    }

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.adminWallet.upsert({
        where: { admin_user_id: request.requester_admin_user_id },
        create: {
          admin_user_id: request.requester_admin_user_id,
          account_number: `ADM${request.requester_admin_user_id.toString().padStart(10, "0")}`,
          amount: 0,
        },
        update: {},
      });

      await tx.adminWallet.update({
        where: { id: wallet.id },
        data: {
          amount: { increment: request.amount },
          updated_at: new Date(),
        },
      });

      await tx.adminWalletRequest.update({
        where: { id: request.id },
        data: {
          status: "approved",
          reviewed_by_admin_user_id: admin.id,
          review_note: payload.review_note,
          reviewed_at: new Date(),
          updated_at: new Date(),
        },
      });
    });

    return successResponse("Request approved successfully.", []);
  } catch (error) {
    return errorResponse("Validation failed.", error, 422);
  }
}
