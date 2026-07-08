import { z } from "zod";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

import { hashValue } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const passwordEmailSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const payload = passwordEmailSchema.parse(await req.json());
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true },
    });

    if (!user) {
      return errorResponse("Email does not exist.", {}, 422);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = await hashValue(token);
    const createdAt = new Date();
    let resetUrl: string | null = null;

    await prisma.passwordResetToken.upsert({
      where: { email: payload.email },
      update: {
        token: hashedToken,
        created_at: createdAt,
      },
      create: {
        email: payload.email,
        token: hashedToken,
        created_at: createdAt,
      },
    });

    resetUrl = `${appUrl}/password/reset/${token}?email=${encodeURIComponent(payload.email)}`;
    await sendPasswordResetEmail(payload.email, resetUrl, payload.email);

    if (process.env.NODE_ENV !== "production") {
      resetUrl = `${appUrl}/password/reset/${token}?email=${encodeURIComponent(payload.email)}`;
    } else {
      resetUrl = null;
    }

    return successResponse("Reset instructions have been sent successfully.", {
      sent: true,
      reset_url: resetUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Validation failed.", error.flatten(), 422);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P1001"
    ) {
      return errorResponse(
        "Database is temporarily unavailable. Please try again later.",
        {},
        503,
      );
    }

    return errorResponse("Unable to process reset request right now.", {}, 500);
  }
}
