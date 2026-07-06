"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { getToken } from "@/lib/browser-auth";

export default function HomePage() {
    const router = useRouter();
    const { profile, loading } = useProfile();
    const [showBalance, setShowBalance] = useState(false);

    useEffect(() => {
        if (!getToken()) {
            router.push("/login");
        }
    }, [router]);

    return (
        <MobileShell
            title="Laravel"
            notifications={profile?.unReadNotifications || 0}
        >
            <div className="home-page home-dashboard">
                <div className="row justify-content-center">
                    <div className="col-12 text-center">
                        <img
                            src={`https://ui-avatars.com/api/?background=02AA9E&color=fff&name=${encodeURIComponent(profile?.name || "User")}`}
                            alt="Profile"
                            className="avatar-lg rounded-circle img-thumbnail profile-avatar"
                        />
                        <h6 className="mb-0 mt-2 profile-name">
                            {loading ? "Loading..." : profile?.name}
                        </h6>
                        <p className="text-black-50 mb-0 mt-2 balance-row">
                            <span id="balance-text">
                                {showBalance
                                    ? profile?.wallet_balance || "0.00 MMK"
                                    : "****** MMK"}
                            </span>
                            <i
                                id="toggle-icon"
                                className={`ms-2 mdi ${showBalance ? "mdi-eye" : "mdi-eye-off"}`}
                                style={{ cursor: "pointer" }}
                                onClick={() => setShowBalance((v) => !v)}
                            />
                        </p>
                    </div>
                    <div className="col-6 mt-3">
                        <Link href="/scan-and-pay" className="home-link-card">
                            <div className="card bg-theme text-white quick-card">
                                <div className="card-body p-3 d-flex align-items-center">
                                    <i className="scan mdi mdi-qrcode-scan" />{" "}
                                    <span>Scan & Pay</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                    <div className="col-6 mt-3">
                        <Link href="/receive-qr" className="home-link-card">
                            <div className="card bg-theme text-white quick-card">
                                <div className="card-body p-3 d-flex align-items-center">
                                    <i className="scan mdi mdi-qrcode" />{" "}
                                    <span>Receive QR</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                    <div className="col-12">
                        <div className="card mb-3 bg-theme text-white action-list-card">
                            <div className="card-body">
                                <Link
                                    href="/transfer"
                                    className="d-flex justify-content-between align-content-center home-action-row"
                                >
                                    <span>
                                        <i className="action-icon mdi mdi-transfer" />{" "}
                                        Transfer
                                    </span>
                                    <span className="mr-2">
                                        <i className="fa fa-angle-right" />
                                    </span>
                                </Link>
                                <hr />
                                <Link
                                    href="/wallet"
                                    className="d-flex justify-content-between align-content-center home-action-row"
                                >
                                    <span>
                                        <i className="action-icon mdi mdi-wallet-plus-outline" />{" "}
                                        Wallet
                                    </span>
                                    <span className="mr-2">
                                        <i className="fa fa-angle-right" />
                                    </span>
                                </Link>
                                <hr />
                                <Link
                                    href="/transactions"
                                    className="d-flex justify-content-between align-content-center home-action-row"
                                >
                                    <span>
                                        <i className="action-icon mdi mdi-text-box-multiple-outline" />{" "}
                                        Transactions
                                    </span>
                                    <span className="mr-2">
                                        <i className="fa fa-angle-right" />
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MobileShell>
    );
}
