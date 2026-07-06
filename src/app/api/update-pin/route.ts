import { z } from "zod";
import { ZodError } from "zod";

import { checkHash, getAuthUser, hashValue } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { toProfileResource } from "@/lib/resources";

const updatePinSchema = z
    .object({
        current_pin: z.string().regex(/^\d{6}$/),
        new_pin_code: z.string().regex(/^\d{6}$/),
        new_pin_code_confirmation: z.string().regex(/^\d{6}$/),
    })
    .refine((v) => v.new_pin_code === v.new_pin_code_confirmation, {
        message: "PIN confirmation does not match.",
    });

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    try {
        const payload = updatePinSchema.parse(await req.json());
        if (!user.pin_code) {
            return errorResponse(
                "You have not set a PIN yet. Please set a PIN first.",
                null,
            );
        }

        if (!(await checkHash(payload.current_pin, user.pin_code))) {
            return errorResponse("The current PIN is incorrect.", null);
        }

        if (await checkHash(payload.new_pin_code, user.pin_code)) {
            return errorResponse(
                "The new PIN must be different from the current PIN.",
                null,
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { pin_code: await hashValue(payload.new_pin_code) },
        });

        await createNotification(updatedUser.id, "General", {
            title: "Change PIN!",
            message: "Your transfer PIN has been changed successfully!",
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
            "PIN code updated successfully!",
            toProfileResource({ ...updatedUser, wallets }, unreadCount),
        );
    } catch (error) {
        if (error instanceof ZodError) {
            return errorResponse("Validation failed.", error.flatten(), 422);
        }
        return errorResponse("Validation failed.", error, 422);
    }
}
