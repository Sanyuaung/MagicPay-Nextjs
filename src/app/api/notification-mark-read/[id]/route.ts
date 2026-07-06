import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

export async function POST(
    _req: Request,
    context: { params: Promise<{ id: string }> },
) {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthenticated.", {}, 401);

    const { id } = await context.params;
    const notification = await prisma.notification.findFirst({
        where: {
            id,
            notifiable_type: "App\\Models\\User",
            notifiable_id: user.id,
        },
    });

    if (!notification) return errorResponse("Notification not found", {}, 404);

    await prisma.notification.update({
        where: { id },
        data: { read_at: new Date() },
    });

    return successResponse("Notification marked as read", []);
}
