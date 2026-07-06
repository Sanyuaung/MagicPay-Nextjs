import type { Notification, Transaction, User, Wallet } from "@prisma/client";

import {
    diffForHumans,
    formatMMK,
    notificationTypeLabel,
    profileImageUrl,
} from "@/lib/formatters";
import { hash2id } from "@/lib/crypto";
import { parseNotificationData } from "@/lib/notifications";

type UserWithWallet = User & {
    wallets: Wallet[];
};

type TransactionWithSource = Transaction & {
    source: User | null;
};

export type ProfileResource = {
    name: string;
    email: string;
    phone: string;
    profile: string;
    wallet_balance: string;
    wallet_account: string;
    unReadNotifications: number;
    has_pin: number;
};

export function toProfileResource(
    user: UserWithWallet,
    unreadCount: number,
): ProfileResource {
    const wallet = user.wallets[0];
    return {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile: profileImageUrl(),
        wallet_balance: wallet ? formatMMK(wallet.amount.toString()) : "0.00",
        wallet_account: wallet?.account_number || "",
        unReadNotifications: unreadCount,
        has_pin: user.pin_code ? 1 : 0,
    };
}

export function toTransactionResource(transaction: TransactionWithSource) {
    let title = "";
    if (transaction.type === 1) {
        title = `Transfer From ${transaction.source?.name || ""}`;
    } else if (transaction.type === 2) {
        title = `Transfer To ${transaction.source?.name || ""}`;
    }

    const createdAt = transaction.created_at || new Date();
    const now = new Date();
    const isToday =
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getDate() === now.getDate();
    const dateText = isToday
        ? "Today"
        : createdAt.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          });
    const timeText = createdAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    return {
        title,
        trx_id: transaction.trx_id,
        type: transaction.type,
        amount: formatMMK(transaction.amount.toString()),
        date_time: `${dateText} at ${timeText}`,
    };
}

export function toTransactionDetailResource(
    transaction: TransactionWithSource,
) {
    let title = "";
    let transferLabel = "Transfer";
    if (transaction.type === 1) {
        title = `Transfer From ${transaction.source?.name || ""}`;
        transferLabel = "Transfer from";
    } else if (transaction.type === 2) {
        title = `Transfer To ${transaction.source?.name || ""}`;
        transferLabel = "Transfer to";
    }

    const createdAt = transaction.created_at || new Date();
    const dateText = createdAt
        .toLocaleString("sv-SE")
        .replace(" ", "-")
        .replace("T", " ");

    const sourcePhone = transaction.source?.phone || "";
    const sourcePhoneMasked = sourcePhone
        ? `${"*".repeat(Math.max(0, sourcePhone.length - 4))}${sourcePhone.slice(-4)}`
        : "-";
    const signedAmount = `${transaction.type === 1 ? "+" : "-"}${formatMMK(transaction.amount.toString())}`;

    return {
        trx_id: transaction.trx_id,
        ref_no: transaction.ref_no,
        amount: formatMMK(transaction.amount.toString()),
        amount_signed: signedAmount,
        type: transaction.type,
        note: transaction.note,
        title,
        transfer_label: transferLabel,
        source_name: transaction.source?.name || "-",
        source_phone_masked: sourcePhoneMasked,
        date_time: dateText,
    };
}

export function toNotificationResource(notification: Notification) {
    const data = parseNotificationData(notification.data);
    const rawTitle = data.title || "";
    const limitedTitle =
        rawTitle.length > 30 ? `${rawTitle.slice(0, 27)}...` : rawTitle;
    return {
        notification_id: notification.id,
        title: limitedTitle,
        message: data.message || "",
        type: notificationTypeLabel(notification.type),
        read: notification.read_at ? 1 : 0,
        date_time: diffForHumans(notification.created_at),
    };
}

export function toNotificationDetailResource(notification: Notification) {
    const data = parseNotificationData(notification.data);
    const base = {
        title: data.title || "",
        message: data.message || "",
        date_time: diffForHumans(notification.created_at),
    };

    if (notification.type.includes("Transaction")) {
        const webLink = data.web_link || "";
        const trxHash = webLink.split("/").filter(Boolean).pop() || "";
        return {
            ...base,
            type: "Transaction",
            trx_id: hash2id(trxHash),
            web_link: webLink,
        };
    }

    if (notification.type.includes("Announce")) {
        return { ...base, type: "Announcement" };
    }

    if (notification.type.includes("General")) {
        return { ...base, type: "Activities" };
    }

    if (notification.type.includes("Promotion")) {
        return {
            ...base,
            type: "Promotion",
            image: data.image ? `/images/promotion/${data.image}` : "",
            web_link: data.web_link || "",
        };
    }

    return { ...base, type: "Other" };
}
