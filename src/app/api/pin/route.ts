import { z } from "zod";
import { ZodError } from "zod";

import { getAuthUser, hashValue } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { toProfileResource } from "@/lib/resources";

const pinSchema = z
    .object({
        pin_code: z.string().regex(/^\d{6}$/),
        pin_code_confirmation: z.string().regex(/^\d{6}$/),
    })
    .refine((v) => v.pin_code === v.pin_code_confirmation, {
        message: "PIN confirmation does not match.",
    });

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    try {
        const payload = pinSchema.parse(await req.json());
        if (user.pin_code) {
            const wallets = await prisma.wallet.findMany({
                where: { user_id: user.id },
                take: 1,
            });
            const unreadCount = await prisma.notification.count({
                where: {
                    notifiable_type: "App\\Models\\User",
                    notifiable_id: user.id,
                    read_at: null,
                },
            });
            return errorResponse(
                "Pin code already set!",
                toProfileResource({ ...user, wallets }, unreadCount),
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { pin_code: await hashValue(payload.pin_code) },
        });

        await createNotification(updatedUser.id, "General", {
            title: "Save PIN!",
            message: "Your transfer PIN has been saved successfully!",
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
            "Pin code set successfully!",
            toProfileResource({ ...updatedUser, wallets }, unreadCount),
        );
    } catch (error) {
        if (error instanceof ZodError) {
            return errorResponse("Validation failed.", error.flatten(), 422);
        }
        return errorResponse("Validation failed.", error, 422);
    }
}
