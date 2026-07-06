"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { apiGet } from "@/lib/browser-api";

type Detail = {
    type: string;
    title: string;
    message: string;
    image?: string;
    web_link?: string;
    date_time: string;
};

export default function Page() {
    const { id } = useParams<{ id: string }>();
    const { profile } = useProfile();
    const [detail, setDetail] = useState<Detail | null>(null);

    useEffect(() => {
        const run = async () => {
            const res = await apiGet<{ data: Detail }>(
                `/api/notification/${id}`,
            );
            setDetail(res.data);
        };
        void run().catch(() => undefined);
    }, [id]);

    return (
        <MobileShell
            title="Notification Detail"
            backHref="/notifications"
            notifications={profile?.unReadNotifications || 0}
        >
            <div className="notification-detail">
                <div className="row">
                    <div className="col-12">
                        <div className="card bg-theme text-white">
                            <div className="card-body p-2">
                                {detail?.image ? (
                                    <img src={detail.image} alt="promotion" />
                                ) : null}
                                <h5>{detail?.title}</h5>
                                <small className="mb-1 mt-4 text-white-50">
                                    {detail?.date_time}
                                </small>
                                <p
                                    className="mb-1 text-white-50"
                                    dangerouslySetInnerHTML={{
                                        __html: detail?.message || "",
                                    }}
                                />
                                {detail?.web_link ? (
                                    <div className="text-center mt-3 mb-3">
                                        <a
                                            className="btn btn-theme btn-sm"
                                            href={detail.web_link}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            See More
                                        </a>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MobileShell>
    );
}
