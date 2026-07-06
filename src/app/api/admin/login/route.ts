import { z } from "zod";

import { checkAdminPassword, createAdminToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getRequestMeta } from "@/lib/request-meta";
import { errorResponse, successResponse } from "@/lib/response";

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const payload = schema.parse(await req.json());
        const meta = getRequestMeta(req);
        const admin = await prisma.adminUser.findUnique({
            where: { email: payload.email },
        });
        if (!admin)
            return errorResponse(
                "These credentials do not match our records.",
                {},
                401,
            );

        const valid = await checkAdminPassword(
            payload.password,
            admin.password,
        );
        if (!valid)
            return errorResponse(
                "These credentials do not match our records.",
                {},
                401,
            );

        await prisma.adminUser.update({
            where: { id: admin.id },
            data: {
                ip: meta.ip,
                user_agent: meta.userAgent,
            },
        });

        const token = createAdminToken(admin.id);
        const response = successResponse("Successfully Logged In!", { token });
        response.cookies.set("magicpay_admin_token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
        });
        return response;
    } catch (error) {
        return errorResponse("Validation failed.", error, 422);
    }
}
