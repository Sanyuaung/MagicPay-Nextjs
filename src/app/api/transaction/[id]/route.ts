import { getAuthUser } from "@/lib/auth";
import { hash2id } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { toTransactionDetailResource } from "@/lib/resources";

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> },
) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    const { id } = await context.params;
    let transaction = await prisma.transaction.findFirst({
        where: {
            user_id: user.id,
            trx_id: id,
        },
        include: { source: true },
    });

    if (!transaction) {
        const decoded = hash2id(id);
        transaction = await prisma.transaction.findFirst({
            where: {
                user_id: user.id,
                trx_id: decoded,
            },
            include: { source: true },
        });
    }

    if (!transaction) {
        return errorResponse("Transaction not found.", {}, 404);
    }

    return successResponse(
        "Transaction Detail",
        toTransactionDetailResource(transaction),
    );
}
