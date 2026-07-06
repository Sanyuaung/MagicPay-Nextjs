import { z } from "zod";
import { ZodError } from "zod";

import { getAdminUser } from "@/lib/admin-auth";
import { parseNotificationData } from "@/lib/notifications";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import {
    getPromotionImageUrl,
    removePromotionImage,
    savePromotionImage,
} from "@/lib/send-information-upload";

const schema = z.object({
    title: z.string().min(1).max(255),
    message: z.string().min(1),
    image: z.string().optional(),
    web_link: z.string().url().optional().or(z.literal("")),
    type: z.enum(["Promotion", "Announcement"]),
    status: z.coerce.number().optional(),
});

async function getPayload(req: Request) {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
        const form = await req.formData();
        const imageEntry = form.get("image");
        const imageFile =
            imageEntry instanceof File && imageEntry.size > 0
                ? imageEntry
                : null;

        const payload = schema.parse({
            title: String(form.get("title") || ""),
            message: String(form.get("message") || ""),
            image: undefined,
            web_link: String(form.get("web_link") || ""),
            type: String(form.get("type") || ""),
            status: Number(form.get("status") || 0),
        });

        return { payload, imageFile };
    }

    const payload = schema.parse(await req.json());
    return { payload, imageFile: null as File | null };
}

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> },
) {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    const { id } = await context.params;
    const item = await prisma.sendInformation.findUnique({
        where: { id: BigInt(id) },
    });
    if (!item) return errorResponse("Send information not found.", {}, 404);
    return successResponse("Send information", {
        id: item.id.toString(),
        type: item.type,
        title: item.title,
        message: item.message,
        image: item.image,
        image_url: getPromotionImageUrl(item.image),
        web_link: item.web_link,
        status: item.status,
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
        const existing = await prisma.sendInformation.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) {
            return errorResponse("Send information not found.", {}, 404);
        }

        const { payload, imageFile } = await getPayload(req);
        let nextImage = existing.image;

        if (payload.type === "Announcement") {
            await removePromotionImage(existing.image);
            nextImage = null;
        } else if (imageFile) {
            await removePromotionImage(existing.image);
            nextImage = await savePromotionImage(imageFile);
        }

        const updated = await prisma.sendInformation.update({
            where: { id: BigInt(id) },
            data: {
                title: payload.title,
                message: payload.message,
                image: nextImage,
                web_link:
                    payload.type === "Announcement"
                        ? null
                        : payload.web_link || null,
                type: payload.type,
                status: payload.status ? 1 : 0,
            },
        });

        if (updated.status === 1) {
            const users = await prisma.user.findMany({ select: { id: true } });
            await Promise.all(
                users.map((user) =>
                    createNotification(
                        user.id,
                        updated.type === "Promotion" ? "Promotion" : "Announce",
                        {
                            title: updated.title,
                            message: updated.message,
                            image: updated.image || undefined,
                            sourceable_id: Number(updated.id),
                            sourceable_type: "App\\Models\\SendInformation",
                            web_link: updated.web_link || undefined,
                        },
                    ),
                ),
            );
        }

        return successResponse("Send Information updated successfully!", {
            id: updated.id.toString(),
            type: updated.type,
            title: updated.title,
            message: updated.message,
            image: updated.image,
            image_url: getPromotionImageUrl(updated.image),
            web_link: updated.web_link,
            status: updated.status,
            created_at: updated.created_at,
            updated_at: updated.updated_at,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return errorResponse("Validation failed.", error.flatten(), 422);
        }
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
    const item = await prisma.sendInformation.findUnique({
        where: { id: BigInt(id) },
    });
    if (!item) return errorResponse("Send information not found.", {}, 404);

    await removePromotionImage(item.image);

    if (item.status === 1) {
        const notifications = await prisma.notification.findMany({
            where: {
                notifiable_type: "App\\Models\\User",
                OR: [
                    { type: "App\\Notifications\\PromotionNotification" },
                    { type: "App\\Notifications\\AnnounceNotification" },
                ],
            },
            select: { id: true, data: true },
        });

        const relatedIds = notifications
            .filter((notification) => {
                const data = parseNotificationData(notification.data);
                return (
                    Number(data.sourceable_id || 0) === Number(item.id) &&
                    data.sourceable_type === "App\\Models\\SendInformation"
                );
            })
            .map((notification) => notification.id);

        if (relatedIds.length) {
            await prisma.notification.deleteMany({
                where: { id: { in: relatedIds } },
            });
        }
    }

    await prisma.sendInformation.delete({ where: { id: BigInt(id) } });
    return successResponse("Send Information deleted successfully.", []);
}
