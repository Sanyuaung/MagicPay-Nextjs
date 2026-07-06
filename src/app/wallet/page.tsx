"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { getToken } from "@/lib/browser-auth";

export default function Page() {
    const router = useRouter();
    const { profile } = useProfile();
    const [showBalance, setShowBalance] = useState(false);

    useEffect(() => {
        if (!getToken()) router.push("/login");
    }, [router]);

    return (
        <MobileShell
            title="Wallet"
            backHref="/"
            notifications={profile?.unReadNotifications || 0}
        >
            <div className="wallet">
                <div className="row">
                    <div className="col-xl-4 col-md-6">
                        <div className="card mini-stat bg-theme text-white">
                            <div className="card-body">
                                <div className="mb-4">
                                    <div className="float-start mini-stat-img me-4">
                                        <img
                                            src="/backend/assets/images/services-icon/03.png"
                                            alt="wallet"
                                        />
                                    </div>
                                    <h5 className="font-size-16 text-uppercase text-white-50">
                                        Balance
                                        <i
                                            id="toggle-icon"
                                            className={`ms-2 mdi ${showBalance ? "mdi-eye" : "mdi-eye-off"}`}
                                            style={{ cursor: "pointer" }}
                                            onClick={() =>
                                                setShowBalance((v) => !v)
                                            }
                                        />
                                    </h5>
                                    <h4 className="fw-medium font-size-24 d-flex align-items-center">
                                        <span id="balance-text">
                                            {showBalance
                                                ? profile?.wallet_balance
                                                : "****** MMK"}
                                        </span>
                                    </h4>
                                </div>
                                <div className="pt-2">
                                    <strong className="text-uppercase text-white mb-0 mt-1">
                                        Account Number
                                    </strong>
                                    <p className="text-white-50 mb-0 mt-1">
                                        {profile?.wallet_account || "-"}
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <p className="text-uppercase text-white mb-0 mt-1">
                                        {profile?.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MobileShell>
    );
}
