import { z } from "zod";

import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { toProfileResource } from "@/lib/resources";

const transferConfirmSchema = z.object({
    receiver: z.string().regex(/^\d+$/),
    amount: z.coerce.number().min(1000),
    notes: z.string().min(1).max(255),
});

export async function POST(req: Request) {
    const sender = await getAuthUser();
    if (!sender) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    try {
        const payload = transferConfirmSchema.parse(await req.json());

        if (payload.receiver === sender.phone) {
            return errorResponse(
                "You cannot transfer money to yourself.",
                null,
                422,
            );
        }

        if (!sender.pin_code) {
            return errorResponse("You need to set a PIN code first.", null);
        }

        const receiver = await prisma.user.findUnique({
            where: { phone: payload.receiver },
            include: { wallets: true },
        });

        if (!receiver) {
            return errorResponse("Recipient not found.", null);
        }

        const senderWallet = await prisma.wallet.findFirst({
            where: { user_id: sender.id },
        });
        if (!senderWallet || Number(senderWallet.amount) < payload.amount) {
            return errorResponse("Insufficient balance.", null);
        }

        const senderUnread = await prisma.notification.count({
            where: {
                notifiable_type: "App\\Models\\User",
                notifiable_id: sender.id,
                read_at: null,
            },
        });

        const senderWallets = await prisma.wallet.findMany({
            where: { user_id: sender.id },
            take: 1,
        });

        return successResponse("Transfer confimation successfully!.", {
            transferAmount: payload.amount,
            notes: payload.notes,
            sender: toProfileResource(
                { ...sender, wallets: senderWallets },
                senderUnread,
            ),
            receiver: toProfileResource(receiver, 0),
        });
    } catch (error) {
        return errorResponse("Validation failed.", error, 422);
    }
}
