import { z } from "zod";

import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const schema = z.object({
  review_note: z.string().trim().min(1),
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
      return errorResponse("Only pending request can be rejected.", {}, 422);
    }

    await prisma.adminWalletRequest.update({
      where: { id: request.id },
      data: {
        status: "rejected",
        reviewed_by_admin_user_id: admin.id,
        review_note: payload.review_note,
        reviewed_at: new Date(),
        updated_at: new Date(),
      },
    });

    return successResponse("Request rejected successfully.", []);
  } catch (error) {
    return errorResponse("Validation failed.", error, 422);
  }
}
