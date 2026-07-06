import type { AdminUser } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "magic-pay-next-secret";

type AdminPayload = {
    sub: string;
    role: "admin";
};

export async function checkAdminPassword(
    raw: string,
    hashed: string,
): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
}

export function createAdminToken(adminId: bigint): string {
    return jwt.sign({ sub: adminId.toString(), role: "admin" }, JWT_SECRET, {
        expiresIn: "30d",
        issuer: process.env.APP_NAME || "MagicPay",
    });
}

function verifyAdminToken(token: string): AdminPayload | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as AdminPayload;
        if (payload.role !== "admin") return null;
        return payload;
    } catch {
        return null;
    }
}

export async function getAdminUser(): Promise<AdminUser | null> {
    const headerStore = await headers();
    const cookieStore = await cookies();
    const authHeader = headerStore.get("authorization");

    let token = "";
    if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "").trim();
    } else {
        token = cookieStore.get("magicpay_admin_token")?.value || "";
    }

    if (!token) return null;
    const payload = verifyAdminToken(token);
    if (!payload?.sub) return null;

    return prisma.adminUser.findUnique({ where: { id: BigInt(payload.sub) } });
}
