import type { User, Wallet } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateUniqueAccountNumber } from "@/lib/uuid";

export async function getOrCreateWallet(user: User): Promise<Wallet> {
    const existing = await prisma.wallet.findFirst({
        where: { user_id: user.id },
    });
    if (existing) return existing;

    const accountNumber = await generateUniqueAccountNumber();
    return prisma.wallet.create({
        data: {
            user_id: user.id,
            account_number: accountNumber,
            amount: 0,
        },
    });
}
