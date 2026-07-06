import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatMMK(value: string | number): string {
    return `${Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} MMK`;
}

export function profileImageUrl(): string {
    return "/images/profile.png";
}

export function notificationTypeLabel(type: string): string {
    if (type.includes("Transaction")) return "Transaction";
    if (type.includes("Announce")) return "Announcement";
    if (type.includes("General")) return "Activities";
    if (type.includes("Promotion")) return "Promotion";
    return "Other";
}

export function diffForHumans(value: Date | null): string {
    if (!value) return "-";
    return dayjs(value).fromNow();
}
