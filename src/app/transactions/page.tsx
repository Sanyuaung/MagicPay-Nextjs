"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { apiGet } from "@/lib/browser-api";

type TransactionItem = {
    title: string;
    trx_id: string;
    type: number;
    amount: string;
    date_time: string;
};

export default function Page() {
    const { profile } = useProfile();
    const [items, setItems] = useState<TransactionItem[]>([]);
    const [type, setType] = useState("");
    const [date, setDate] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const load = async (nextPage = 1, append = false) => {
        setIsLoading(true);
        const q = new URLSearchParams();
        if (type) q.set("type", type);
        if (date) q.set("date", date);
        q.set("page", String(nextPage));
        const res = await apiGet<{
            data: TransactionItem[];
            meta?: { current_page: number; last_page: number };
        }>(`/api/transactions?${q.toString()}`);
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

    return (
        <MobileShell
            title="Transactions"
            backHref="/"
            notifications={profile?.unReadNotifications || 0}
        >
            <div className="transactions">
                <div className="row">
                    <div className="col-12">
                        <div className="card sticky-filter bg-theme">
                            <div className="card-body p-2">
                                <div className="row">
                                    <i className="text-white mdi mdi-filter-menu-outline" />
                                    <div className="col-6">
                                        <input
                                            className="form-control date"
                                            type="date"
                                            value={date}
                                            onChange={(e) =>
                                                setDate(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="col-6">
                                        <select
                                            className="type form-select"
                                            value={type}
                                            onChange={(e) =>
                                                setType(e.target.value)
                                            }
                                        >
                                            <option value="">All</option>
                                            <option value="1">Income</option>
                                            <option value="2">Expense</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-sm btn-theme mt-2"
                                    onClick={() => {
                                        void load(1, false).catch(
                                            () => undefined,
                                        );
                                    }}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                        <div className="infinite-scroll">
                            {items.map((transaction) => (
                                <Link
                                    key={transaction.trx_id}
                                    href={`/transaction/${transaction.trx_id}`}
                                >
                                    <div className="card bg-theme text-white">
                                        <div className="card-body p-2">
                                            <div className="d-flex justify-content-between">
                                                <h6>{transaction.trx_id}</h6>
                                                <p
                                                    className={`mb-1 ${transaction.type === 1 ? "text-success" : "text-danger"}`}
                                                >
                                                    {transaction.amount}
                                                </p>
                                            </div>
                                            <p className="mb-1 text-white-50">
                                                {transaction.title}
                                            </p>
                                            <p className="mb-1 text-white-50">
                                                {transaction.date_time}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
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
