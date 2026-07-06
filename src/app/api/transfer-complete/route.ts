import { z } from "zod";
import { ZodError } from "zod";

import { checkHash, getAuthUser } from "@/lib/auth";
import { id2hash } from "@/lib/crypto";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { toProfileResource } from "@/lib/resources";
import {
    generateUniqueAccountNumber,
    generateUniqueRefNumber,
    generateUniqueTrxNumber,
} from "@/lib/uuid";

const transferCompleteSchema = z.object({
    receiver: z.string().regex(/^\d+$/),
    amount: z.coerce.number().min(1000),
    pin_code: z.string().regex(/^\d{6}$/),
    notes: z.string().min(1).max(255),
});

export async function POST(req: Request) {
    const sender = await getAuthUser();
    if (!sender) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    try {
        const payload = transferCompleteSchema.parse(await req.json());

        if (payload.receiver === sender.phone) {
            return errorResponse(
                "You cannot transfer money to yourself.",
                null,
                422,
            );
        }

        if (
            !sender.pin_code ||
            !(await checkHash(payload.pin_code, sender.pin_code))
        ) {
            return errorResponse("Incorrect PIN code.", null);
        }

        const receiver = await prisma.user.findUnique({
            where: { phone: payload.receiver },
        });
        if (!receiver) {
            return errorResponse("Receiver not found.", null);
        }

        const senderWallet = await prisma.wallet.findFirst({
            where: { user_id: sender.id },
        });
        if (!senderWallet || Number(senderWallet.amount) < payload.amount) {
            return errorResponse("Insufficient balance.", null);
        }

        const refNo = await generateUniqueRefNumber();
        const senderTrxId = `TRX-${await generateUniqueTrxNumber()}`;
        const receiverTrxId = `TRX-${await generateUniqueTrxNumber()}`;
        const receiverAccountNumber = await generateUniqueAccountNumber();

        const [senderTrx, receiverTrx] = await prisma.$transaction(
            async (tx) => {
                await tx.wallet.update({
                    where: { id: senderWallet.id },
                    data: { amount: { decrement: payload.amount } },
                });

                const receiverWallet = await tx.wallet.findFirst({
                    where: { user_id: receiver.id },
                });
                if (receiverWallet) {
                    await tx.wallet.update({
                        where: { id: receiverWallet.id },
                        data: { amount: { increment: payload.amount } },
                    });
                } else {
                    await tx.wallet.create({
                        data: {
                            user_id: receiver.id,
                            account_number: receiverAccountNumber,
                            amount: payload.amount,
                        },
                    });
                }

                const senderTrx = await tx.transaction.create({
                    data: {
                        trx_id: senderTrxId,
                        ref_no: `REF-${refNo}`,
                        user_id: sender.id,
                        type: 2,
                        amount: payload.amount,
                        source_id: receiver.id,
                        note: payload.notes || `Transfer to ${receiver.phone}`,
                    },
                });

                const receiverTrx = await tx.transaction.create({
                    data: {
                        trx_id: receiverTrxId,
                        ref_no: `REF-${refNo}`,
                        user_id: receiver.id,
                        type: 1,
                        amount: payload.amount,
                        source_id: sender.id,
                        note: payload.notes || `Received from ${sender.phone}`,
                    },
                });

                return [senderTrx, receiverTrx];
            },
        );

        const appUrl = process.env.APP_URL || "http://localhost:3000";

        await Promise.all([
            createNotification(sender.id, "Transaction", {
                title: "Expense Made!",
                message: `You have made an expense of ${payload.amount} to ${receiver.name}`,
                sourceable_id: Number(senderTrx.id),
                sourceable_type: "App\\Models\\Transaction",
                web_link: `${appUrl}/transaction/${id2hash(senderTrx.trx_id)}`,
            }),
            createNotification(receiver.id, "Transaction", {
                title: "Income Received!",
                message: `You have received an income of ${payload.amount} from ${sender.name}`,
                sourceable_id: Number(receiverTrx.id),
                sourceable_type: "App\\Models\\Transaction",
                web_link: `${appUrl}/transaction/${id2hash(receiverTrx.trx_id)}`,
            }),
        ]);

        const senderWallets = await prisma.wallet.findMany({
            where: { user_id: sender.id },
            take: 1,
        });
        const senderUnread = await prisma.notification.count({
            where: {
                notifiable_type: "App\\Models\\User",
                notifiable_id: sender.id,
                read_at: null,
            },
        });

        return successResponse("Transfer successful!", {
            trx_id: id2hash(senderTrx.trx_id),
            amount: payload.amount,
            receiver: toProfileResource(
                {
                    ...receiver,
                    wallets: await prisma.wallet.findMany({
                        where: { user_id: receiver.id },
                        take: 1,
                    }),
                },
                0,
            ),
            sender: toProfileResource(
                { ...sender, wallets: senderWallets },
                senderUnread,
            ),
            notes: payload.notes,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return errorResponse("Validation failed.", error.flatten(), 422);
        }
        return errorResponse("Transaction failed.", error, 500);
    }
}
