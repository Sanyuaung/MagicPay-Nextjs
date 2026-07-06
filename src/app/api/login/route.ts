import { z } from "zod";

import { checkHash, createAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestMeta } from "@/lib/request-meta";
import { errorResponse, successResponse } from "@/lib/response";
import { getOrCreateWallet } from "@/lib/wallet";

const loginSchema = z.object({
    phone: z.string().regex(/^\d+$/),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const payload = loginSchema.parse(await req.json());
        const meta = getRequestMeta(req);
        const user = await prisma.user.findUnique({
            where: { phone: payload.phone },
        });

        if (!user) {
            return errorResponse(
                "These credentials do not match our records.",
                {},
                401,
            );
        }

        const valid = await checkHash(payload.password, user.password);
        if (!valid) {
            return errorResponse(
                "These credentials do not match our records.",
                {},
                401,
            );
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                login_at: new Date(),
                ip: meta.ip,
                user_agent: meta.userAgent,
            },
        });

        await getOrCreateWallet(user);
        const token = await createAccessToken(user.id);

        const response = successResponse("Successfully Logged In!", { token });
        response.cookies.set("magicpay_token", token, {
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
