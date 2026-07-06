import { z } from "zod";

import { getAuthUser } from "@/lib/auth";
import { encryptQR, id2hash } from "@/lib/crypto";
import { errorResponse, successResponse } from "@/lib/response";

const receiveSchema = z.object({
    amount: z.coerce.number().min(1000).optional(),
    notes: z.string().max(255).optional(),
});

export async function GET(req: Request) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    const { searchParams } = new URL(req.url);
    const parsed = receiveSchema.safeParse({
        amount: searchParams.get("amount") ?? undefined,
        notes: searchParams.get("notes") ?? undefined,
    });

    if (!parsed.success) {
        return errorResponse("Validation failed.", parsed.error.flatten(), 422);
    }

    const secret = process.env.SECRET_KEY || "";
    const phone = id2hash(user.phone);

    const payload: Record<string, string> = {
        phone,
        secret: id2hash(secret),
    };

    if (parsed.data.amount !== undefined) {
        payload.amount = id2hash(String(parsed.data.amount));
        payload.note = id2hash(String(parsed.data.notes || ""));
    }

    const encrypted = encryptQR(JSON.stringify(payload));
    return successResponse("Successullly Receive QR Generated", encrypted);
}
