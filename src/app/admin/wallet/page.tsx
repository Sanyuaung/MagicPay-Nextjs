"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiGet } from "@/lib/browser-api";

type WalletItem = {
    id: string;
    account_number: string;
    amount: string;
    account_person: string;
    created_at: string | null;
    updated_at: string | null;
    user?: { id: string; name: string; email: string; phone: string };
};

type SortKey =
    | "account_number"
    | "account_person"
    | "amount"
    | "created_at"
    | "updated_at";

type PaginationState = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function WalletPage() {
    const [items, setItems] = useState<WalletItem[]>([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("created_at");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1,
    });
    const [visibleColumns, setVisibleColumns] = useState({
        accountNumber: true,
        accountPerson: true,
        amount: true,
        createdAt: true,
        updatedAt: true,
    });

    const load = async () => {
        try {
            setIsLoading(true);
            setError("");
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
                search,
                sortBy: sortKey,
                sortDir: sortDirection,
            });
            const res = await apiGet<{
                data: { items: WalletItem[]; pagination: PaginationState };
            }>(`/api/admin/wallets?${params.toString()}`);
            setItems(res.data?.items || []);
            setPagination(
                res.data?.pagination || {
                    page: 1,
                    pageSize: 10,
                    total: 0,
                    totalPages: 1,
                },
            );
        } catch (err) {
            setItems([]);
            setError(
                err instanceof Error ? err.message : "Failed to load wallets",
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void load().catch(() => undefined);
    }, [page, pageSize, search, sortDirection, sortKey]);

    const getPaginationButtons = () => {
        const totalPages = pagination.totalPages;
        const current = pagination.page;
        if (totalPages <= 1) return [1];

        const buttons: number[] = [];
        const start = Math.max(1, current - 2);
        const end = Math.min(totalPages, start + 4);
        const normalizedStart = Math.max(1, end - 4);

        for (let i = normalizedStart; i <= end; i += 1) {
            buttons.push(i);
        }

        return buttons;
    };

    const formatDateTime = (value: string | null) => {
        if (!value) return "-";
        return new Date(value).toLocaleString("sv-SE", { hour12: false });
    };

    const requestSort = (key: SortKey) => {
        setPage(1);
        if (sortKey === key) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setSortKey(key);
        setSortDirection("asc");
    };

    const renderSortHeader = (label: string, key: SortKey) => (
        <button
            type="button"
            className="table-sort-btn"
            onClick={() => requestSort(key)}
        >
            {label}
            <span className="table-sort-indicator">
                {sortKey === key ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
            </span>
        </button>
    );

    const toggleColumn = (key: keyof typeof visibleColumns) => {
        setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const renderColumnToggleItem = (
        label: string,
        key: keyof typeof visibleColumns,
    ) => (
        <button
            type="button"
            className={`dropdown-item column-visibility-item ${
                visibleColumns[key] ? "is-active" : ""
            }`}
            onClick={() => toggleColumn(key)}
        >
            <span>{label}</span>
            <span className="column-visibility-check">✓</span>
        </button>
    );

    return (
        <AdminShell
            title="Wallets"
            breadcrumb="Wallets"
            titleIconClass="ti-wallet"
        >
            <div className="d-block mb-3">
                <div className="pb-3 me-3 d-inline-block">
                    <Link
                        className="btn btn-success"
                        href="/admin/wallet/add-amount"
                        role="button"
                        title="Add Amount"
                    >
                        <i className="typcn typcn-plus" /> Add amount to wallet
                        account
                    </Link>{" "}
                    <Link
                        className="btn btn-danger"
                        href="/admin/wallet/reduce-amount"
                        role="button"
                        title="Reduce Amount"
                    >
                        <i className="typcn typcn-minus" /> Reduce amount from
                        wallet account
                    </Link>
                </div>
            </div>
            <div className="col-lg-12">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="column-visibility-wrap">
                                <button
                                    className="btn btn-secondary buttons-collection dropdown-toggle buttons-colvis column-visibility-toggle"
                                    type="button"
                                    onClick={() =>
                                        setShowColumnMenu((prev) => !prev)
                                    }
                                >
                                    Column Visibility
                                </button>
                                {showColumnMenu ? (
                                    <div className="dropdown-menu show column-visibility-menu">
                                        {renderColumnToggleItem(
                                            "Account Number",
                                            "accountNumber",
                                        )}
                                        {renderColumnToggleItem(
                                            "Account Person",
                                            "accountPerson",
                                        )}
                                        {renderColumnToggleItem(
                                            "Amount (MMK)",
                                            "amount",
                                        )}
                                        {renderColumnToggleItem(
                                            "Created at",
                                            "createdAt",
                                        )}
                                        {renderColumnToggleItem(
                                            "Updated at",
                                            "updatedAt",
                                        )}
                                    </div>
                                ) : null}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <label className="mb-0">Search:</label>
                                <input
                                    className="form-control"
                                    style={{ width: 200 }}
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => {
                                        setPage(1);
                                        setSearch(e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                        {error ? <p className="text-danger">{error}</p> : null}
                        <div className="table-responsive">
                            <table
                                className="table table-striped table-bordered dt-responsive nowrap"
                                style={{
                                    borderCollapse: "collapse",
                                    borderSpacing: 0,
                                    width: "100%",
                                }}
                            >
                                <thead>
                                    <tr>
                                        {visibleColumns.accountNumber ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Account Number",
                                                    "account_number",
                                                )}
                                            </th>
                                        ) : null}
                                        {visibleColumns.accountPerson ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Account Person",
                                                    "account_person",
                                                )}
                                            </th>
                                        ) : null}
                                        {visibleColumns.amount ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Amount (MMK)",
                                                    "amount",
                                                )}
                                            </th>
                                        ) : null}
                                        {visibleColumns.createdAt ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Created at",
                                                    "created_at",
                                                )}
                                            </th>
                                        ) : null}
                                        {visibleColumns.updatedAt ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Updated at",
                                                    "updated_at",
                                                )}
                                            </th>
                                        ) : null}
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    Object.values(
                                                        visibleColumns,
                                                    ).filter(Boolean).length ||
                                                    1
                                                }
                                                className="table-loading-cell"
                                            >
                                                <div className="table-loading-dots">
                                                    <span />
                                                    <span />
                                                    <span />
                                                    <strong>
                                                        Loading data...
                                                    </strong>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : null}
                                    {!isLoading
                                        ? items.map((item) => (
                                              <tr key={item.id}>
                                                  {visibleColumns.accountNumber ? (
                                                      <td>
                                                          {item.account_number}
                                                      </td>
                                                  ) : null}
                                                  {visibleColumns.accountPerson ? (
                                                      <td>
                                                          {item.user ? (
                                                              <div>
                                                                  <strong>
                                                                      Name :
                                                                  </strong>{" "}
                                                                  {
                                                                      item.user
                                                                          .name
                                                                  }
                                                                  <br />
                                                                  <strong>
                                                                      Email :
                                                                  </strong>{" "}
                                                                  {
                                                                      item.user
                                                                          .email
                                                                  }
                                                                  <br />
                                                                  <strong>
                                                                      Phone :
                                                                  </strong>{" "}
                                                                  {
                                                                      item.user
                                                                          .phone
                                                                  }
                                                              </div>
                                                          ) : (
                                                              "N/A"
                                                          )}
                                                      </td>
                                                  ) : null}
                                                  {visibleColumns.amount ? (
                                                      <td>{item.amount}</td>
                                                  ) : null}
                                                  {visibleColumns.createdAt ? (
                                                      <td>
                                                          {formatDateTime(
                                                              item.created_at,
                                                          )}
                                                      </td>
                                                  ) : null}
                                                  {visibleColumns.updatedAt ? (
                                                      <td>
                                                          {formatDateTime(
                                                              item.updated_at,
                                                          )}
                                                      </td>
                                                  ) : null}
                                              </tr>
                                          ))
                                        : null}
                                    {!isLoading && items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    Object.values(
                                                        visibleColumns,
                                                    ).filter(Boolean).length ||
                                                    1
                                                }
                                                className="text-center py-4"
                                            >
                                                No data available in table
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <div className="d-flex align-items-center gap-2 text-muted small">
                                <span>Show</span>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: 84 }}
                                    value={pageSize}
                                    onChange={(event) => {
                                        setPage(1);
                                        setPageSize(Number(event.target.value));
                                    }}
                                >
                                    {[10, 25, 50, 100].map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                                <span>entries</span>
                                <span className="border-start ps-2 ms-1">
                                    Total: {pagination.total}
                                </span>
                            </div>
                            <ul className="pagination pagination-sm mb-0">
                                <li
                                    className={`page-item ${
                                        pagination.page <= 1 || isLoading
                                            ? "disabled"
                                            : ""
                                    }`}
                                >
                                    <button
                                        type="button"
                                        className="page-link"
                                        onClick={() =>
                                            setPage((prev) =>
                                                Math.max(1, prev - 1),
                                            )
                                        }
                                    >
                                        Previous
                                    </button>
                                </li>
                                {getPaginationButtons().map((pageNumber) => (
                                    <li
                                        key={pageNumber}
                                        className={`page-item ${
                                            pageNumber === pagination.page
                                                ? "active"
                                                : ""
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            className="page-link"
                                            disabled={
                                                pageNumber ===
                                                    pagination.page || isLoading
                                            }
                                            onClick={() => setPage(pageNumber)}
                                        >
                                            {pageNumber}
                                        </button>
                                    </li>
                                ))}
                                <li
                                    className={`page-item ${
                                        pagination.page >=
                                            pagination.totalPages || isLoading
                                            ? "disabled"
                                            : ""
                                    }`}
                                >
                                    <button
                                        type="button"
                                        className="page-link"
                                        onClick={() =>
                                            setPage((prev) =>
                                                Math.min(
                                                    pagination.totalPages,
                                                    prev + 1,
                                                ),
                                            )
                                        }
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
