import { z } from "zod";
import bcrypt from "bcryptjs";

import { getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

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
    const item = await prisma.adminUser.findUnique({
        where: { id: BigInt(id) },
    });
    if (!item) return errorResponse("Admin user not found.", {}, 404);
    return successResponse("Admin user", {
        id: item.id.toString(),
        name: item.name,
        email: item.email,
        phone: item.phone,
        ip: item.ip,
        user_agent: item.user_agent,
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
        const updated = await prisma.adminUser.update({
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
        return successResponse("Admin user updated successfully.", {
            id: updated.id.toString(),
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            ip: updated.ip,
            user_agent: updated.user_agent,
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
    await prisma.adminUser.delete({ where: { id: BigInt(id) } });
    return successResponse("Admin user deleted successfully.", []);
}
