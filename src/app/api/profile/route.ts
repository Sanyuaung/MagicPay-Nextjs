import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { toProfileResource } from "@/lib/resources";

export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    const [wallets, unreadCount] = await Promise.all([
        prisma.wallet.findMany({ where: { user_id: user.id }, take: 1 }),
        prisma.notification.count({
            where: {
                notifiable_type: "App\\Models\\User",
                notifiable_id: user.id,
                read_at: null,
            },
        }),
    ]);

    return successResponse(
        "Profile Data",
        toProfileResource({ ...user, wallets }, unreadCount),
    );
}
