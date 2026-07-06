import { ZodError, z } from "zod";

import { checkHash, hashValue } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const TOKEN_EXPIRES_MINUTES = 60;

const resetPasswordSchema = z
    .object({
        email: z.string().email(),
        token: z.string().min(1),
        password: z.string().min(8),
        password_confirmation: z.string().min(8),
    })
    .refine((v) => v.password === v.password_confirmation, {
        message: "Password confirmation does not match.",
    });

export async function POST(req: Request) {
    try {
        const payload = resetPasswordSchema.parse(await req.json());

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { email: payload.email },
        });

        if (!resetToken || !resetToken.created_at) {
            return errorResponse("Invalid or expired reset token.", {}, 422);
        }

        const expiresAt = new Date(
            resetToken.created_at.getTime() + TOKEN_EXPIRES_MINUTES * 60 * 1000,
        );
        if (expiresAt < new Date()) {
            await prisma.passwordResetToken.deleteMany({
                where: { email: payload.email },
            });
            return errorResponse("Invalid or expired reset token.", {}, 422);
        }

        const isValidToken = await checkHash(payload.token, resetToken.token);
        if (!isValidToken) {
            return errorResponse("Invalid or expired reset token.", {}, 422);
        }

        const user = await prisma.user.findUnique({
            where: { email: payload.email },
            select: { id: true },
        });

        if (!user) {
            return errorResponse("Invalid or expired reset token.", {}, 422);
        }

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { password: await hashValue(payload.password) },
            }),
            prisma.passwordResetToken.deleteMany({
                where: { email: payload.email },
            }),
        ]);

        return successResponse("Password reset successfully!", { reset: true });
    } catch (error) {
        if (error instanceof ZodError) {
            return errorResponse("Validation failed.", error.flatten(), 422);
        }
        return errorResponse("Validation failed.", error, 422);
    }
}
