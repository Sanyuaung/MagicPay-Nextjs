import { prisma } from "@/lib/prisma";

function random16Digit(): string {
    return Math.floor(
        1000000000000000 + Math.random() * 9000000000000000,
    ).toString();
}

export async function generateUniqueAccountNumber(): Promise<string> {
    while (true) {
        const candidate = random16Digit();
        const existing = await prisma.wallet.findUnique({
            where: { account_number: candidate },
            select: { id: true },
        });
        if (!existing) return candidate;
    }
}

export async function generateUniqueTrxNumber(): Promise<string> {
    while (true) {
        const candidate = random16Digit();
        const existing = await prisma.transaction.findFirst({
            where: { trx_id: candidate },
            select: { id: true },
        });
        if (!existing) return candidate;
    }
}

export async function generateUniqueRefNumber(): Promise<string> {
    while (true) {
        const candidate = random16Digit();
        const existing = await prisma.transaction.findFirst({
            where: { ref_no: candidate },
            select: { id: true },
        });
        if (!existing) return candidate;
    }
}
