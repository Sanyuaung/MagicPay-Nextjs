"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { apiGet } from "@/lib/browser-api";

type TransactionDetail = {
    trx_id: string;
    ref_no: string;
    amount: string;
    amount_signed: string;
    type: number;
    note: string;
    title: string;
    transfer_label: string;
    source_name: string;
    source_phone_masked: string;
    date_time: string;
};

export default function Page() {
    const { trx_id } = useParams<{ trx_id: string }>();
    const { profile } = useProfile();
    const [detail, setDetail] = useState<TransactionDetail | null>(null);

    useEffect(() => {
        const run = async () => {
            const res = await apiGet<{ data: TransactionDetail }>(
                `/api/transaction/${trx_id}`,
            );
            setDetail(res.data);
        };
        void run().catch(() => undefined);
    }, [trx_id]);

    return (
        <MobileShell
            title="Transaction Detail"
            backHref="/transactions"
            notifications={profile?.unReadNotifications || 0}
        >
            <div className="transaction-detail">
                <div className="row">
                    <div className="col-12">
                        <div className="card bg-theme text-white">
                            <div className="card-body pt-0 pb-0">
                                <div className="text-center">
                                    <i className="mdi mdi-checkbox-marked-circle-outline" />
                                    <small className="d-block">
                                        Payment Successful
                                    </small>
                                    <div className="d-flex justify-content-center align-content-center">
                                        <p
                                            className={`mb-1 ${detail?.type === 1 ? "text-success" : "text-danger"}`}
                                        >
                                            {detail?.amount_signed}{" "}
                                            <small className="amount">
                                                (MMK)
                                            </small>
                                        </p>
                                    </div>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between">
                                    <small className="mb-3">
                                        Transaction Time
                                    </small>
                                    <small className="mb-3">
                                        {detail?.date_time}
                                    </small>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <small className="mb-3">
                                        Transaction No.
                                    </small>
                                    <small className="mb-3">
                                        {detail?.trx_id}
                                    </small>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <small className="mb-3">
                                        Reference No.
                                    </small>
                                    <small className="mb-3">
                                        {detail?.ref_no}
                                    </small>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <small className="mb-3">
                                        Transaction Type
                                    </small>
                                    <small className="mb-3">
                                        {detail?.type === 1 ? (
                                            <span className="badge bg-success rounded-pill">
                                                Income
                                            </span>
                                        ) : (
                                            <span className="badge bg-danger rounded-pill">
                                                Expense
                                            </span>
                                        )}
                                    </small>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <small className="mb-3">
                                        {detail?.transfer_label || "Transfer"}
                                    </small>
                                    <small className="mb-3">
                                        {detail?.source_name || "-"} (
                                        {detail?.source_phone_masked || "-"})
                                    </small>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <small className="mb-3">Amount</small>
                                    <small className="mb-3">
                                        {detail?.amount_signed}{" "}
                                        <small className="amount">(MMK)</small>
                                    </small>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <small className="mb-3">Notes</small>
                                    <small className="mb-3">
                                        {detail?.note}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MobileShell>
    );
}
