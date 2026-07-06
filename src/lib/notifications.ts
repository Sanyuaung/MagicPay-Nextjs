import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";

type NotificationPayload = {
    title: string;
    message: string;
    sourceable_id?: number | bigint;
    sourceable_type?: string;
    image?: string;
    web_link?: string;
};

const USER_NOTIFIABLE = "App\\Models\\User";

export async function createNotification(
    userId: bigint,
    type: "General" | "Transaction" | "Promotion" | "Announce",
    payload: NotificationPayload,
): Promise<void> {
    const fqcnMap = {
        General: "App\\Notifications\\GeneralNotification",
        Transaction: "App\\Notifications\\TransactionNotification",
        Promotion: "App\\Notifications\\PromotionNotification",
        Announce: "App\\Notifications\\AnnounceNotification",
    } as const;

    await prisma.notification.create({
        data: {
            id: randomUUID(),
            type: fqcnMap[type],
            notifiable_type: USER_NOTIFIABLE,
            notifiable_id: userId,
            data: JSON.stringify(payload),
            created_at: new Date(),
            updated_at: new Date(),
        },
    });
}

export function parseNotificationData(data: string): NotificationPayload {
    try {
        return JSON.parse(data) as NotificationPayload;
    } catch {
        return { title: "", message: "" };
    }
}
