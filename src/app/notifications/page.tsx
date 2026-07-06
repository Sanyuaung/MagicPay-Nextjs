"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { apiDelete, apiGet, apiPost } from "@/lib/browser-api";

type Noti = {
    notification_id: string;
    title: string;
    message: string;
    type: string;
    read: number;
    date_time: string;
};

export default function Page() {
    const { profile } = useProfile();
    const [items, setItems] = useState<Noti[]>([]);
    const [type, setType] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const load = async (nextPage = 1, append = false) => {
        setIsLoading(true);
        const q = type ? `?type=${encodeURIComponent(type)}` : "";
        const join = q ? "&" : "?";
        const res = await apiGet<{
            data: Noti[];
            meta?: { current_page: number; last_page: number };
        }>(`/api/notifications${q}${join}page=${nextPage}`);
        setItems((prev) =>
            append ? [...prev, ...(res.data || [])] : res.data || [],
        );
        setPage(res.meta?.current_page || nextPage);
        setLastPage(res.meta?.last_page || 1);
        setIsLoading(false);
    };

    useEffect(() => {
        void load(1, false).catch(() => undefined);
    }, []);

    useEffect(() => {
        void load(1, false).catch(() => undefined);
    }, [type]);

    return (
        <MobileShell
            title="Notifications"
            backHref="/"
            notifications={profile?.unReadNotifications || 0}
            notificationType={type}
        >
            <div className="notification-page">
                <div className="row">
                    <div className="col-12">
                        <div className="card sticky-filter bg-theme">
                            <div className="card-body p-2">
                                <div className="row">
                                    <div className="col-6">
                                        <select
                                            className="type form-select"
                                            value={type}
                                            onChange={(e) =>
                                                setType(e.target.value)
                                            }
                                        >
                                            <option value="">All</option>
                                            <option value="App\\Notifications\\TransactionNotification">
                                                Transaction
                                            </option>
                                            <option value="App\\Notifications\\AnnounceNotification">
                                                Announcement
                                            </option>
                                            <option value="App\\Notifications\\GeneralNotification">
                                                Activities
                                            </option>
                                            <option value="App\\Notifications\\PromotionNotification">
                                                Promotion
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="infinite-scroll">
                            {items.map((notification) => (
                                <div
                                    className="card bg-theme text-white"
                                    key={notification.notification_id}
                                >
                                    <div className="card-body p-2">
                                        <Link
                                            href={`/notification/${notification.notification_id}`}
                                        >
                                            <div className="d-flex justify-content-between">
                                                <h6
                                                    className={
                                                        notification.read === 0
                                                            ? "text-danger"
                                                            : ""
                                                    }
                                                >
                                                    {notification.title}
                                                </h6>
                                                <p
                                                    className={`mb-1 ${notification.read === 0 ? "text-danger" : ""}`}
                                                >
                                                    <small>
                                                        {notification.date_time}
                                                    </small>
                                                </p>
                                            </div>
                                            <p
                                                className="mb-1 text-white-50"
                                                dangerouslySetInnerHTML={{
                                                    __html: notification.message,
                                                }}
                                            />
                                        </Link>
                                        <div className="d-flex justify-content-end gap-2">
                                            {notification.read === 0 ? (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={async () => {
                                                        await apiPost(
                                                            `/api/notification-mark-read/${notification.notification_id}`,
                                                            {},
                                                        );
                                                        await load(1, false);
                                                    }}
                                                >
                                                    Mark as Read
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={async () => {
                                                        await apiPost(
                                                            `/api/notification-mark-unread/${notification.notification_id}`,
                                                            {},
                                                        );
                                                        await load(1, false);
                                                    }}
                                                >
                                                    Mark as Unread
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={async () => {
                                                    await apiDelete(
                                                        `/api/notification-delete/${notification.notification_id}`,
                                                    );
                                                    await load(1, false);
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {page < lastPage ? (
                                <div className="text-center mt-2">
                                    <button
                                        className="btn btn-sm btn-theme"
                                        disabled={isLoading}
                                        onClick={() => {
                                            void load(page + 1, true).catch(
                                                () => undefined,
                                            );
                                        }}
                                    >
                                        {isLoading ? "Loading..." : "Load More"}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </MobileShell>
    );
}
