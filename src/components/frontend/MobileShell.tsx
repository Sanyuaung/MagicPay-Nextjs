"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { apiGet, apiPost } from "@/lib/browser-api";
import { clearToken } from "@/lib/browser-auth";

type Props = {
    title: string;
    children: ReactNode;
    backHref?: string;
    notifications?: number;
    notificationType?: string;
};

export function MobileShell({
    title,
    children,
    backHref,
    notifications = 0,
    notificationType = "",
}: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const typeQuery = notificationType
        ? `?type=${encodeURIComponent(notificationType)}`
        : "";

    const onLogout = async () => {
        try {
            await apiPost("/api/logout", {});
        } catch {
            // Ignore logout API failures and clear local session anyway.
        }
        clearToken();
        router.push("/login");
    };

    const onNotificationBulkAction = async (endpoint: string) => {
        await apiGet(`${endpoint}${typeQuery}`);
        router.refresh();
        setMenuOpen(false);
    };

    return (
        <div id="app" className="container-fluid">
            <div className="header-menu">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="row">
                            <div className="col-3 text-center">
                                {backHref ? (
                                    <Link href={backHref}>
                                        <i className="mdi mdi-keyboard-backspace" />
                                    </Link>
                                ) : null}
                            </div>
                            <div className="col-6 text-center">
                                <Link href="/" className="logo-admin">
                                    <img
                                        src="/backend/assets/images/logo-sm.png"
                                        height={30}
                                        alt="logo"
                                    />
                                    <h3>{title}</h3>
                                </Link>
                            </div>
                            <div className="col-3 text-center">
                                {pathname === "/notifications" ? (
                                    <div className="dropdown d-inline-block text-start">
                                        <button
                                            className="waves-effect btn dropdown-toggle noti-icon text-muted fs-5 p-0"
                                            type="button"
                                            onClick={() =>
                                                setMenuOpen((prev) => !prev)
                                            }
                                        >
                                            <i className="mdi mdi-dots-vertical" />
                                            {notifications > 0 ? (
                                                <span className="badge bg-danger rounded-pill">
                                                    {notifications}
                                                </span>
                                            ) : null}
                                        </button>
                                        {menuOpen ? (
                                            <ul
                                                className="dropdown-menu show"
                                                style={{ position: "absolute" }}
                                            >
                                                <li>
                                                    <button
                                                        type="button"
                                                        className="dropdown-item"
                                                        onClick={() =>
                                                            void onNotificationBulkAction(
                                                                "/api/notification-mark-all-read",
                                                            ).catch(
                                                                () => undefined,
                                                            )
                                                        }
                                                    >
                                                        <i className="mdi mdi-email-multiple" />
                                                        Make All As Read
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        type="button"
                                                        className="dropdown-item"
                                                        onClick={() =>
                                                            void onNotificationBulkAction(
                                                                "/api/notification-mark-all-unread",
                                                            ).catch(
                                                                () => undefined,
                                                            )
                                                        }
                                                    >
                                                        <i className="mdi mdi-email-open-multiple" />
                                                        Make All As Unread
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        type="button"
                                                        className="dropdown-item text-danger"
                                                        onClick={() =>
                                                            void onNotificationBulkAction(
                                                                "/api/notification-delete-all",
                                                            ).catch(
                                                                () => undefined,
                                                            )
                                                        }
                                                    >
                                                        <i className="mdi mdi-delete" />
                                                        Delete All Notifications
                                                    </button>
                                                </li>
                                            </ul>
                                        ) : null}
                                    </div>
                                ) : (
                                    <Link
                                        href="/notifications"
                                        className="logo-admin btn header-item noti-icon waves-effect"
                                    >
                                        <i className="mdi mdi-bell-ring" />
                                        {notifications > 0 ? (
                                            <span className="badge bg-danger rounded-pill">
                                                {notifications}
                                            </span>
                                        ) : null}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content">
                <div className="row justify-content-center">
                    <div className="col-md-8">{children}</div>
                </div>
            </div>

            <div className="bottom-menu">
                <Link href="/scan-and-pay" className="scan-tab">
                    <div className="inside">
                        <i className="mdi mdi-qrcode-scan" />
                    </div>
                </Link>
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="row">
                            <div className="col-3 text-center">
                                <Link href="/">
                                    <i className="mdi mdi-home" />
                                    <p>Home</p>
                                </Link>
                            </div>
                            <div className="col-3 text-center">
                                <Link href="/wallet">
                                    <i className="mdi mdi-wallet" />
                                    <p>Wallet</p>
                                </Link>
                            </div>
                            <div className="col-3 text-center">
                                <Link href="/transactions">
                                    <i className="mdi mdi-repeat" />
                                    <p>Transitions</p>
                                </Link>
                            </div>
                            <div className="col-3 text-center">
                                <Link href="/profile">
                                    <i className="mdi mdi-account" />
                                    <p>Profile</p>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="button"
                className="btn btn-link d-none"
                onClick={onLogout}
            >
                Logout
            </button>
        </div>
    );
}
