import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/response";
import { toNotificationResource } from "@/lib/resources";

export async function GET(req: Request) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    const { searchParams } = new URL(req.url);
    const selectedType = searchParams.get("type");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = 5;

    const where = {
        notifiable_type: "App\\Models\\User",
        notifiable_id: user.id,
        ...(selectedType ? { type: selectedType } : {}),
    };

    const [unreadCount, total, notifications] = await Promise.all([
        prisma.notification.count({
            where: {
                ...where,
                read_at: null,
            },
        }),
        prisma.notification.count({ where }),
        prisma.notification.findMany({
            where,
            orderBy: { created_at: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
    ]);

    return Response.json({
        data: notifications.map(toNotificationResource),
        result: 1,
        type: "success",
        message: "Notifications Data",
        unreadCount,
        meta: {
            current_page: page,
            per_page: pageSize,
            total,
            last_page: Math.max(1, Math.ceil(total / pageSize)),
        },
    });
}
