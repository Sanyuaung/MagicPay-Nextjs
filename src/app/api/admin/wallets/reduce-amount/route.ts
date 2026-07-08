import { z } from "zod";
import { ZodError } from "zod";

import { getAdminUser } from "@/lib/admin-auth";
import { id2hash } from "@/lib/crypto";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { generateUniqueRefNumber, generateUniqueTrxNumber } from "@/lib/uuid";
import { getOrCreateWallet } from "@/lib/wallet";

const schema = z.object({
  user_id: z.coerce.bigint(),
  amount: z.coerce.number().min(1),
  description: z.string().min(1),
});

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);

  try {
    const payload = schema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { id: payload.user_id },
    });
    if (!user) return errorResponse("User not found.", {}, 404);

    const wallet = await getOrCreateWallet(user);
    const adminWallet = await prisma.adminWallet.upsert({
      where: { admin_user_id: admin.id },
      create: {
        admin_user_id: admin.id,
        account_number: `ADM${admin.id.toString().padStart(10, "0")}`,
        amount: 0,
      },
      update: {},
    });

    if (Number(wallet.amount) < payload.amount) {
      return errorResponse("Insufficient balance in your wallet.", {}, 422);
    }

    const refNo = await generateUniqueRefNumber();
    const trxNo = await generateUniqueTrxNumber();

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { amount: { decrement: payload.amount } },
      });

      await tx.adminWallet.update({
        where: { id: adminWallet.id },
        data: { amount: { increment: payload.amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          trx_id: `TRX-${trxNo}`,
          ref_no: `REF-${refNo}`,
          user_id: user.id,
          type: 2,
          amount: payload.amount,
          note: payload.description,
        },
      });

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      await createNotification(user.id, "Transaction", {
        title: "Reduce Amount Complete!",
        message: `Reduce ${payload.amount} to your wallet account`,
        sourceable_type: "App\\Models\\Transaction",
        web_link: `${appUrl}/transaction/${id2hash(transaction.trx_id)}`,
      });
    });

    return successResponse("Wallet amount reduced successfully.", []);
  } catch (error) {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      return errorResponse(issue?.message || "Validation failed.", error, 422);
    }

    const message =
      error instanceof Error
        ? `Wallet amount reduced failed: ${error.message}`
        : "Wallet amount reduced failed.";
    return errorResponse(message, error, 422);
  }
}
