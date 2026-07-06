import { z } from "zod";

import { createAccessToken, hashValue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestMeta } from "@/lib/request-meta";
import { errorResponse, successResponse } from "@/lib/response";
import { getOrCreateWallet } from "@/lib/wallet";

const registerSchema = z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().max(255),
    phone: z.string().min(9).max(11),
    password: z.string().min(8),
});

export async function POST(req: Request) {
    try {
        const payload = registerSchema.parse(await req.json());
        const meta = getRequestMeta(req);

        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email: payload.email }, { phone: payload.phone }],
            },
            select: { id: true },
        });

        if (existing) {
            return errorResponse("Email or phone already exists.", {}, 422);
        }

        const user = await prisma.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                password: await hashValue(payload.password),
                ip: meta.ip,
                user_agent: meta.userAgent,
                login_at: new Date(),
            },
        });

        await getOrCreateWallet(user);
        const token = await createAccessToken(user.id);

        const response = successResponse("Successfully Registered!", { token });
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
