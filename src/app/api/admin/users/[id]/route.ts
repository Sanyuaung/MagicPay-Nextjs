import { z } from "zod";
import bcrypt from "bcryptjs";

import { getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { getOrCreateWallet } from "@/lib/wallet";

const updateSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().regex(/^\d+$/),
    password: z.string().min(6).optional().or(z.literal("")),
});

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> },
) {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    const { id } = await context.params;
    const item = await prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!item) return errorResponse("User not found.", {}, 404);
    return successResponse("User", {
        id: item.id.toString(),
        name: item.name,
        email: item.email,
        phone: item.phone,
        ip: item.ip,
        user_agent: item.user_agent,
        login_at: item.login_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
    });
}

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> },
) {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    const { id } = await context.params;
    try {
        const payload = updateSchema.parse(await req.json());
        const updated = await prisma.user.update({
            where: { id: BigInt(id) },
            data: {
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                ...(payload.password
                    ? { password: await bcrypt.hash(payload.password, 12) }
                    : {}),
            },
        });
        await getOrCreateWallet(updated);
        return successResponse("User updated successfully.", {
            id: updated.id.toString(),
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            ip: updated.ip,
            user_agent: updated.user_agent,
            login_at: updated.login_at,
            created_at: updated.created_at,
            updated_at: updated.updated_at,
        });
    } catch (error) {
        return errorResponse("Validation failed.", error, 422);
    }
}

export async function DELETE(
    _req: Request,
    context: { params: Promise<{ id: string }> },
) {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    const { id } = await context.params;
    await prisma.user.delete({ where: { id: BigInt(id) } });
    return successResponse("User deleted successfully.", []);
}
