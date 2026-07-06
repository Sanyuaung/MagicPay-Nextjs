import { getAdminUser } from "@/lib/admin-auth";
import { errorResponse, successResponse } from "@/lib/response";

export async function POST() {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    const response = successResponse("Successfully Logout!", []);
    response.cookies.set("magicpay_admin_token", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/",
    });
    return response;
}
