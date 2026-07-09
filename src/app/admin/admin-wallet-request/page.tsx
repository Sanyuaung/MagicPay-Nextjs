"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiGet, apiPost } from "@/lib/browser-api";

type WalletRequestItem = {
  id: string;
  requester_admin_user_id: string;
  amount: string;
  description: string;
  status: "pending" | "approved" | "rejected" | string;
  review_note: string;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  requester: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  requester_recent_7d_count?: number;
  is_high_amount?: boolean;
  is_aging_pending?: boolean;
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type RiskSummary = {
  high_amount_7d: number;
  aging_pending: number;
  frequent_requesters_7d: number;
};

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type AdminProfile = {
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
};

type MyWalletRequestItem = {
  id: string;
  amount: string;
  description: string;
  status: string;
  review_note: string;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export default function AdminWalletRequestPage() {
  const [items, setItems] = useState<WalletRequestItem[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [riskSummary, setRiskSummary] = useState<RiskSummary>({
    high_amount_7d: 0,
    aging_pending: 0,
    frequent_requesters_7d: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [queryVersion, setQueryVersion] = useState(0);

  const isSuperAdmin = adminProfile?.role === "super_admin";

  const loadProfile = async () => {
    try {
      const res = await apiGet<{ data?: AdminProfile }>("/api/admin/profile");
      setAdminProfile(res.data || null);
    } catch {
      setAdminProfile(null);
    }
  };

  const load = async () => {
    if (!adminProfile?.role) return;

    try {
      setIsLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (status.trim()) params.set("status", status.trim());
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      if (isSuperAdmin) {
        if (search.trim()) params.set("search", search.trim());
        if (minAmount.trim()) params.set("minAmount", minAmount.trim());
        if (maxAmount.trim()) params.set("maxAmount", maxAmount.trim());

        const res = await apiGet<{
          data: {
            items: WalletRequestItem[];
            pagination: PaginationState;
            risk_summary?: RiskSummary;
          };
        }>(`/api/admin/admin-wallet-requests?${params.toString()}`);

        const pendingRes = await apiGet<{
          data?: { pagination?: { total?: number } };
        }>("/api/admin/admin-wallet-requests?page=1&pageSize=1&status=pending");

        setItems(res.data?.items || []);
        setPendingTotal(pendingRes.data?.pagination?.total ?? 0);
        setRiskSummary(
          res.data?.risk_summary || {
            high_amount_7d: 0,
            aging_pending: 0,
            frequent_requesters_7d: 0,
          },
        );
        setPagination(
          res.data?.pagination || {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 1,
          },
        );
      } else {
        const res = await apiGet<{
          data?: {
            items?: MyWalletRequestItem[];
            pagination?: PaginationState;
          };
        }>(`/api/admin/my-wallet/add-amount-requests?${params.toString()}`);

        const pendingRes = await apiGet<{
          data?: { pagination?: { total?: number } };
        }>(
          "/api/admin/my-wallet/add-amount-requests?page=1&pageSize=1&status=pending",
        );

        const mappedItems: WalletRequestItem[] = (res.data?.items || []).map(
          (item) => ({
            id: item.id,
            requester_admin_user_id: "",
            amount: item.amount,
            description: item.description,
            status: item.status,
            review_note: item.review_note,
            reviewed_at: item.reviewed_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
            requester: {
              id: "",
              name: adminProfile?.name || "Me",
              email: adminProfile?.email || "-",
              phone: adminProfile?.phone || "-",
            },
            reviewer: item.reviewer,
            requester_recent_7d_count: 0,
            is_high_amount: false,
            is_aging_pending: false,
          }),
        );

        setItems(mappedItems);
        setPendingTotal(pendingRes.data?.pagination?.total ?? 0);
        setRiskSummary({
          high_amount_7d: 0,
          aging_pending: 0,
          frequent_requesters_7d: 0,
        });
        setPagination(
          res.data?.pagination || {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 1,
          },
        );
      }
    } catch (err) {
      setItems([]);
      setPendingTotal(0);
      setRiskSummary({
        high_amount_7d: 0,
        aging_pending: 0,
        frequent_requesters_7d: 0,
      });
      setPagination({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile().catch(() => undefined);
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [adminProfile?.role, isSuperAdmin, queryVersion, page, pageSize]);

  const runSearch = () => {
    setPage(1);
    setQueryVersion((prev) => prev + 1);
  };

  const runPrint = () => {
    window.print();
  };

  const submitAction = async (id: string, mode: "approve" | "reject") => {
    try {
      setIsSaving(true);
      setError("");
      setMessage("");

      const note = (reviewNote[id] || "").trim();
      if (!note) {
        setError(
          mode === "approve"
            ? "Approval note is required."
            : "Reject reason is required.",
        );
        return;
      }

      await apiPost(`/api/admin/admin-wallet-requests/${id}/${mode}`, {
        review_note: note,
      });

      setMessage(
        mode === "approve"
          ? "Request approved successfully."
          : "Request rejected successfully.",
      );

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("sv-SE", { hour12: false });
  };

  const statusBadgeClass = (value: string) => {
    if (value === "approved") return "badge bg-success";
    if (value === "rejected") return "badge bg-danger";
    return "badge bg-warning text-dark";
  };

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

  const getRiskFlags = (item: WalletRequestItem): string[] => {
    const flags: string[] = [];
    if (item.is_high_amount) {
      flags.push("High amount");
    }

    if (item.is_aging_pending) {
      flags.push("Aging pending");
    }

    if ((item.requester_recent_7d_count || 0) >= 3) {
      flags.push("Frequent requester");
    }

    return flags;
  };

  const exportFile = async (type: "csv" | "pdf") => {
    try {
      setIsExporting(true);
      setError("");

      const params = new URLSearchParams();
      if (status.trim()) params.set("status", status.trim());
      if (search.trim()) params.set("search", search.trim());
      if (minAmount.trim()) params.set("minAmount", minAmount.trim());
      if (maxAmount.trim()) params.set("maxAmount", maxAmount.trim());
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      params.set("export", type);

      const res = await fetch(
        `/api/admin/admin-wallet-requests?${params.toString()}`,
      );
      if (!res.ok) {
        throw new Error(`Unable to export ${type.toUpperCase()}.`);
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `wallet-requests-${new Date().toISOString().slice(0, 10)}.${type}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminShell
      title="Wallet Requests"
      breadcrumb="Wallet Requests"
      titleIconClass="mdi mdi-wallet-plus-outline"
    >
      <div className="col-lg-12">
        <div className="card">
          <div className="card-body">
            <div className="row g-3 mb-3 admin-wallet-filter-panel">
              <div className="col-12">
                <div className="row g-2">
                  <div className="col-md-4">
                    <div className="alert alert-info mb-0 py-2">
                      High Amount Alerts:{" "}
                      <strong>{riskSummary.high_amount_7d}</strong>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="alert alert-warning mb-0 py-2">
                      Aging Pending Alerts:{" "}
                      <strong>{riskSummary.aging_pending}</strong>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="alert alert-secondary mb-0 py-2">
                      Frequent Requester Alerts:{" "}
                      <strong>{riskSummary.frequent_requesters_7d}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {pendingTotal > 0 ? (
                <div className="col-12">
                  <div className="alert alert-warning mb-0" role="alert">
                    <strong>{pendingTotal}</strong> pending request
                    {pendingTotal > 1 ? "s are" : " is"} waiting for review.
                  </div>
                </div>
              ) : null}

              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select wallet-filter-control"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="col-md-5">
                <label className="form-label">Search</label>
                <input
                  className="form-control wallet-filter-control"
                  placeholder="Search by requester name/email"
                  value={search}
                  disabled={!isSuperAdmin}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Min Amount</label>
                <input
                  className="form-control wallet-filter-control"
                  type="number"
                  min={0}
                  value={minAmount}
                  disabled={!isSuperAdmin}
                  onChange={(event) => setMinAmount(event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Max Amount</label>
                <input
                  className="form-control wallet-filter-control"
                  type="number"
                  min={0}
                  value={maxAmount}
                  disabled={!isSuperAdmin}
                  onChange={(event) => setMaxAmount(event.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">From Date</label>
                <input
                  className="form-control wallet-filter-control"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">To Date</label>
                <input
                  className="form-control wallet-filter-control"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <div className="wallet-icon-actions ms-md-2">
                  <button
                    type="button"
                    className="btn wallet-icon-btn wallet-btn-search"
                    title="Search"
                    aria-label="Search"
                    onClick={runSearch}
                  >
                    <i className="mdi mdi-magnify" />
                  </button>
                  <button
                    type="button"
                    className="btn wallet-icon-btn wallet-btn-reset"
                    title="Reset"
                    aria-label="Reset"
                    onClick={() => {
                      setStatus("");
                      setSearch("");
                      setMinAmount("");
                      setMaxAmount("");
                      setFromDate("");
                      setToDate("");
                      setPage(1);
                      setQueryVersion((prev) => prev + 1);
                    }}
                  >
                    <i className="mdi mdi-restore" />
                  </button>
                  <button
                    type="button"
                    className="btn wallet-icon-btn wallet-btn-csv"
                    title="Export CSV"
                    aria-label="Export CSV"
                    disabled={isExporting}
                    onClick={() => {
                      void exportFile("csv").catch(() => undefined);
                    }}
                  >
                    <i className="mdi mdi-download" />
                  </button>
                  <button
                    type="button"
                    className="btn wallet-icon-btn wallet-btn-pdf"
                    title="Export PDF"
                    aria-label="Export PDF"
                    disabled={isExporting}
                    onClick={() => {
                      void exportFile("pdf").catch(() => undefined);
                    }}
                  >
                    <i className="mdi mdi-file-pdf-box" />
                  </button>
                  <button
                    type="button"
                    className="btn wallet-icon-btn wallet-btn-print"
                    title="Print / PDF"
                    aria-label="Print / PDF"
                    onClick={runPrint}
                  >
                    <i className="mdi mdi-printer" />
                  </button>
                </div>
              </div>
            </div>

            {message ? <p className="text-success">{message}</p> : null}
            {error ? <p className="text-danger">{error}</p> : null}

            <div className="table-responsive">
              <table className="table table-bordered mb-0 admin-wallet-requests-table">
                <colgroup>
                  <col style={{ width: 72 }} />
                  <col style={{ width: 240 }} />
                  <col style={{ width: 150 }} />
                  <col style={{ width: 180 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 170 }} />
                  <col style={{ width: 220 }} />
                  <col style={{ width: 170 }} />
                  <col style={{ width: 170 }} />
                  <col style={{ width: 220 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Requester</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Review Note</th>
                    <th>Reviewed By</th>
                    <th>Created At</th>
                    <th>Reviewed At</th>
                    <th style={{ minWidth: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-3">
                        Loading requests...
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading
                    ? items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>
                            <div>
                              <strong>{item.requester.name}</strong>
                            </div>
                            <div>{item.requester.email}</div>
                            <div>{item.requester.phone}</div>
                          </td>
                          <td>
                            <div>{item.amount}</div>
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {getRiskFlags(item).map((flag) => (
                                <span
                                  key={`${item.id}-${flag}`}
                                  className="badge bg-light text-dark border"
                                >
                                  {flag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>{item.description || "-"}</td>
                          <td>
                            <span className={statusBadgeClass(item.status)}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.review_note || "-"}</td>
                          <td>
                            {item.reviewer
                              ? `${item.reviewer.name} (${item.reviewer.email})`
                              : "-"}
                          </td>
                          <td>{formatDateTime(item.created_at)}</td>
                          <td>{formatDateTime(item.reviewed_at)}</td>
                          <td>
                            {isSuperAdmin && item.status === "pending" ? (
                              <>
                                <textarea
                                  className="form-control mb-2"
                                  rows={2}
                                  placeholder="Approval note / reject reason (required)"
                                  value={reviewNote[item.id] || ""}
                                  onChange={(event) =>
                                    setReviewNote((prev) => ({
                                      ...prev,
                                      [item.id]: event.target.value,
                                    }))
                                  }
                                />
                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    disabled={isSaving}
                                    onClick={() => {
                                      void submitAction(
                                        item.id,
                                        "approve",
                                      ).catch(() => undefined);
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    disabled={isSaving}
                                    onClick={() => {
                                      void submitAction(
                                        item.id,
                                        "reject",
                                      ).catch(() => undefined);
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </>
                            ) : (
                              "Completed"
                            )}
                          </td>
                        </tr>
                      ))
                    : null}

                  {!isLoading && items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-3">
                        No requests found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 admin-table-footer">
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
                    pagination.page <= 1 || isLoading ? "disabled" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                </li>
                {getPaginationButtons().map((pageNumber) => (
                  <li
                    key={pageNumber}
                    className={`page-item ${
                      pageNumber === pagination.page ? "active" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      disabled={pageNumber === pagination.page || isLoading}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    pagination.page >= pagination.totalPages || isLoading
                      ? "disabled"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() =>
                      setPage((prev) =>
                        Math.min(pagination.totalPages, prev + 1),
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
