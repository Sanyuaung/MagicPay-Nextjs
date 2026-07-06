import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

const APP_NAME = process.env.APP_NAME || "MagicPay";
const JWT_SECRET = process.env.JWT_SECRET || "magic-pay-next-secret";
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

type JwtPayload = {
    sub: string;
};

type AccessTokenPayload = {
    sub: string;
    token: string;
};

export async function hashValue(value: string): Promise<string> {
    return bcrypt.hash(value, 12);
}

export async function checkHash(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
}

async function getOrCreateOauthClientId(userId: bigint): Promise<bigint> {
    const existing = await prisma.oauthClient.findFirst({
        where: {
            personal_access_client: true,
            revoked: false,
        },
        select: { id: true },
    });

    if (existing) {
        return existing.id;
    }

    const now = new Date();
    const created = await prisma.oauthClient.create({
        data: {
            user_id: userId,
            name: `${APP_NAME} Personal Access Client`,
            secret: crypto.randomBytes(40).toString("hex").slice(0, 100),
            provider: "users",
            redirect: "http://localhost",
            personal_access_client: true,
            password_client: false,
            revoked: false,
            created_at: now,
            updated_at: now,
        },
        select: { id: true },
    });

    await prisma.oauthPersonalAccessClient.create({
        data: {
            client_id: created.id,
            created_at: now,
            updated_at: now,
        },
    });

    return created.id;
}

export async function createAccessToken(userId: bigint): Promise<string> {
    const token = crypto.randomBytes(40).toString("hex").slice(0, 100);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_TTL_SECONDS * 1000);
    const clientId = await getOrCreateOauthClientId(userId);

    await prisma.oauthAccessToken.create({
        data: {
            id: token,
            user_id: userId,
            client_id: clientId,
            name: APP_NAME,
            scopes: "[]",
            revoked: false,
            created_at: now,
            updated_at: now,
            expires_at: expiresAt,
        },
    });

    return token;
}

function verifyLegacyJwt(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}

export async function verifyAccessToken(
    token: string,
): Promise<AccessTokenPayload | null> {
    const dbToken = await prisma.oauthAccessToken.findFirst({
        where: {
            id: token,
            revoked: false,
            OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        select: { user_id: true },
    });

    if (dbToken?.user_id) {
        return { sub: dbToken.user_id.toString(), token };
    }

    const jwtPayload = verifyLegacyJwt(token);
    if (!jwtPayload?.sub) {
        return null;
    }

    return { sub: jwtPayload.sub, token };
}

export async function getAuthTokenFromRequest(): Promise<string> {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    const cookieStore = await cookies();

    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.replace("Bearer ", "").trim();
    }

    return cookieStore.get("magicpay_token")?.value || "";
}

export async function revokeAccessToken(token: string): Promise<void> {
    if (!token) {
        return;
    }

    await prisma.oauthAccessToken.updateMany({
        where: { id: token, revoked: false },
        data: {
            revoked: true,
            updated_at: new Date(),
        },
    });
}

export async function getAuthUser(): Promise<User | null> {
    const token = await getAuthTokenFromRequest();

    if (!token) {
        return null;
    }

    const payload = await verifyAccessToken(token);
    if (!payload?.sub) {
        return null;
    }

    return prisma.user.findUnique({ where: { id: BigInt(payload.sub) } });
}
