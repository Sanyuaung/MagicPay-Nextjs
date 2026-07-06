import { z } from "zod";

import { getAuthUser } from "@/lib/auth";
import { decryptQR, hash2id } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { toProfileResource } from "@/lib/resources";

const scanSchema = z.object({
    qrContent: z.string().min(1),
});

async function handleScan(qrContent: string) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    const parsed = scanSchema.safeParse({
        qrContent,
    });
    if (!parsed.success) {
        return errorResponse("Validation failed.", parsed.error.flatten(), 422);
    }

    let decoded: {
        phone?: string;
        secret?: string;
        amount?: string;
        note?: string;
    };
    try {
        decoded = JSON.parse(decryptQR(parsed.data.qrContent));
    } catch {
        return errorResponse("Invalid QR code data.", [], 400);
    }

    if (!decoded.phone || !decoded.secret) {
        return errorResponse("Invalid QR code data.", [], 400);
    }

    if (hash2id(decoded.secret) !== (process.env.SECRET_KEY || "")) {
        return errorResponse("Invalid QR code.", [], 403);
    }

    const receiverPhone = hash2id(decoded.phone);
    const receiver = await prisma.user.findUnique({
        where: { phone: receiverPhone },
        include: { wallets: true },
    });

    if (!receiver) {
        return errorResponse("Recipient not found.", [], 404);
    }

    const unreadCount = await prisma.notification.count({
        where: {
            notifiable_type: "App\\Models\\User",
            notifiable_id: user.id,
            read_at: null,
        },
    });

    return successResponse("QR code scanned successfully.", {
        sender: toProfileResource(
            {
                ...user,
                wallets: await prisma.wallet.findMany({
                    where: { user_id: user.id },
                    take: 1,
                }),
            },
            unreadCount,
        ),
        receiver: toProfileResource(receiver, 0),
        amount: decoded.amount ? hash2id(decoded.amount) : null,
        note: decoded.note ? hash2id(decoded.note) : null,
    });
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    return handleScan(searchParams.get("qrContent") || "");
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    return handleScan(String(body?.qrContent || ""));
}
