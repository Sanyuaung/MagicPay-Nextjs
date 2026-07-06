import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const updateSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().regex(/^\d+$/),
    password: z.string().min(6).optional().or(z.literal("")),
});

export async function GET() {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    return successResponse("Profile", {
        id: admin.id.toString(),
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
    });
}

export async function PUT(req: Request) {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    try {
        const payload = updateSchema.parse(await req.json());
        const updated = await prisma.adminUser.update({
            where: { id: admin.id },
            data: {
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                ...(payload.password
                    ? { password: await bcrypt.hash(payload.password, 12) }
                    : {}),
            },
        });

        return successResponse("Profile updated successfully.", {
            id: updated.id.toString(),
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            created_at: updated.created_at,
            updated_at: updated.updated_at,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return errorResponse("Email or phone already exists.", {}, 422);
        }

        return errorResponse("Validation failed.", error, 422);
    }
}
