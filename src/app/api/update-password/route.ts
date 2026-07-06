import { z } from "zod";
import { ZodError } from "zod";

import { checkHash, getAuthUser, hashValue } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { toProfileResource } from "@/lib/resources";

const updatePasswordSchema = z
    .object({
        current_password: z.string().min(1),
        new_password: z.string().min(8),
        new_password_confirmation: z.string().min(8),
    })
    .refine((v) => v.new_password === v.new_password_confirmation, {
        message: "Password confirmation does not match.",
    });

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    try {
        const payload = updatePasswordSchema.parse(await req.json());
        if (!(await checkHash(payload.current_password, user.password))) {
            return errorResponse("The current password is incorrect.", null);
        }

        if (await checkHash(payload.new_password, user.password)) {
            return errorResponse(
                "The new password must be different from the current password.",
                null,
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { password: await hashValue(payload.new_password) },
        });

        await createNotification(updatedUser.id, "General", {
            title: "Change Password!",
            message: "Your account password has been changed successfully!",
            sourceable_id: Number(updatedUser.id),
            sourceable_type: "App\\Models\\User",
        });

        const wallets = await prisma.wallet.findMany({
            where: { user_id: updatedUser.id },
            take: 1,
        });
        const unreadCount = await prisma.notification.count({
            where: {
                notifiable_type: "App\\Models\\User",
                notifiable_id: updatedUser.id,
                read_at: null,
            },
        });

        return successResponse(
            "Password updated successfully!",
            toProfileResource({ ...updatedUser, wallets }, unreadCount),
        );
    } catch (error) {
        if (error instanceof ZodError) {
            return errorResponse("Validation failed.", error.flatten(), 422);
        }
        return errorResponse("Validation failed.", error, 422);
    }
}
