import { z } from "zod";

import { getAdminUser } from "@/lib/admin-auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import {
    getPromotionImageUrl,
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

export async function GET(req: Request) {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(
        100,
        Math.max(1, Number(url.searchParams.get("pageSize") || 10)),
    );
    const search = (url.searchParams.get("search") || "").trim();

    const allowedSortKeys = [
        "type",
        "title",
        "message",
        "web_link",
        "status",
        "created_at",
        "updated_at",
    ] as const;
    const sortByRaw = url.searchParams.get("sortBy") || "created_at";
    const sortBy = allowedSortKeys.includes(
        sortByRaw as (typeof allowedSortKeys)[number],
    )
        ? sortByRaw
        : "created_at";
    const sortDir =
        (url.searchParams.get("sortDir") || "desc").toLowerCase() === "asc"
            ? "asc"
            : "desc";

    const where = search
        ? {
              OR: [
                  { type: { contains: search, mode: "insensitive" as const } },
                  {
                      title: {
                          contains: search,
                          mode: "insensitive" as const,
                      },
                  },
                  {
                      message: {
                          contains: search,
                          mode: "insensitive" as const,
                      },
                  },
              ],
          }
        : undefined;

    const total = await prisma.sendInformation.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * pageSize;

    const items = await prisma.sendInformation.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip,
        take: pageSize,
    });
    return successResponse("Send information", {
        items: items.map((item) => ({
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
        })),
        pagination: {
            page: currentPage,
            pageSize,
            total,
            totalPages,
        },
    });
}

export async function POST(req: Request) {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    try {
        const { payload, imageFile } = await getPayload(req);
        let imageName: string | null = null;
        if (payload.type === "Promotion" && imageFile) {
            imageName = await savePromotionImage(imageFile);
        }

        const created = await prisma.sendInformation.create({
            data: {
                title: payload.title,
                message: payload.message,
                image: payload.type === "Promotion" ? imageName : null,
                web_link:
                    payload.type === "Promotion"
                        ? payload.web_link || null
                        : null,
                type: payload.type,
                status: payload.status ? 1 : 0,
            },
        });

        if (created.status === 1) {
            const users = await prisma.user.findMany({ select: { id: true } });
            await Promise.all(
                users.map((user) =>
                    createNotification(
                        user.id,
                        created.type === "Promotion" ? "Promotion" : "Announce",
                        {
                            title: created.title,
                            message: created.message,
                            image: created.image || undefined,
                            sourceable_id: Number(created.id),
                            sourceable_type: "App\\Models\\SendInformation",
                            web_link: created.web_link || undefined,
                        },
                    ),
                ),
            );
        }

        return successResponse("Send Information created successfully!", {
            id: created.id.toString(),
            type: created.type,
            title: created.title,
            message: created.message,
            image: created.image,
            image_url: getPromotionImageUrl(created.image),
            web_link: created.web_link,
            status: created.status,
            created_at: created.created_at,
            updated_at: created.updated_at,
        });
    } catch (error) {
        return errorResponse("Validation failed.", error, 422);
    }
}
