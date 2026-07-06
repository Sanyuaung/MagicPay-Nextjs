import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthenticated.", {}, 401);

    const type = new URL(req.url).searchParams.get("type");

    await prisma.notification.deleteMany({
        where: {
            notifiable_type: "App\\Models\\User",
            notifiable_id: user.id,
            ...(type ? { type } : {}),
        },
    });

    return successResponse("All notifications deleted", []);
}
