import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/response";
import { toTransactionResource } from "@/lib/resources";

export async function GET(req: Request) {
    const user = await getAuthUser();
    if (!user) {
        return errorResponse("Unauthenticated.", {}, 401);
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const date = searchParams.get("date");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = 5;

    const where: {
        user_id: bigint;
        type?: number;
        created_at?: { gte: Date; lt: Date };
    } = { user_id: user.id };

    if (type) {
        where.type = Number(type);
    }

    if (date) {
        const start = new Date(`${date}T00:00:00`);
        if (Number.isNaN(start.getTime())) {
            return errorResponse(
                "Validation failed.",
                { date: "Invalid date" },
                422,
            );
        }
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        where.created_at = { gte: start, lt: end };
    }

    const [total, items] = await Promise.all([
        prisma.transaction.count({ where }),
        prisma.transaction.findMany({
            where,
            include: { source: true },
            orderBy: { created_at: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
    ]);

    return Response.json({
        data: items.map(toTransactionResource),
        result: 1,
        type: "success",
        message: "Transactions Data",
        meta: {
            current_page: page,
            per_page: pageSize,
            total,
            last_page: Math.max(1, Math.ceil(total / pageSize)),
        },
    });
}
