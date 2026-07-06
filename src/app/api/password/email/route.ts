import { z } from "zod";
import crypto from "crypto";

import { hashValue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const passwordEmailSchema = z.object({
    email: z.string().email(),
});

export async function POST(req: Request) {
    try {
        const payload = passwordEmailSchema.parse(await req.json());

        const user = await prisma.user.findUnique({
            where: { email: payload.email },
            select: { id: true },
        });

        let resetUrl: string | null = null;
        if (user) {
            const token = crypto.randomBytes(32).toString("hex");
            const hashedToken = await hashValue(token);
            const createdAt = new Date();

            await prisma.passwordResetToken.upsert({
                where: { email: payload.email },
                update: {
                    token: hashedToken,
                    created_at: createdAt,
                },
                create: {
                    email: payload.email,
                    token: hashedToken,
                    created_at: createdAt,
                },
            });

            if (process.env.NODE_ENV !== "production") {
                const appUrl = process.env.APP_URL || "http://localhost:3000";
                resetUrl = `${appUrl}/password/reset/${token}?email=${encodeURIComponent(payload.email)}`;
            }
        }

        return successResponse(
            "If your email exists, reset instructions have been sent.",
            {
                sent: true,
                reset_url: resetUrl,
            },
        );
    } catch (error) {
        return errorResponse("Validation failed.", error, 422);
    }
}
