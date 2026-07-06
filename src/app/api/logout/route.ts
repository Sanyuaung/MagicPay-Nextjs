import {
    getAuthTokenFromRequest,
    getAuthUser,
    revokeAccessToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { toProfileResource } from "@/lib/resources";

export async function POST() {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    const token = await getAuthTokenFromRequest();
    await revokeAccessToken(token);

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

    const response = successResponse(
        "Successfully Logout!",
        toProfileResource({ ...user, wallets }, unreadCount),
    );
    response.cookies.set("magicpay_token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/",
    });
    return response;
}
