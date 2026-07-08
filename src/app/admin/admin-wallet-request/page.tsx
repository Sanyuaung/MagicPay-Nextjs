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
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function AdminWalletRequestPage() {
  const [items, setItems] = useState<WalletRequestItem[]>([]);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setIsLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (status.trim()) params.set("status", status.trim());
      if (search.trim()) params.set("search", search.trim());

      const res = await apiGet<{
        data: { items: WalletRequestItem[]; pagination: PaginationState };
      }>(
        `/api/admin/admin-wallet-requests?${params.toString()}`,
      );
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
      setPagination({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load().catch(() => undefined);
  }, [status, search, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  const submitAction = async (id: string, mode: "approve" | "reject") => {
    try {
      setIsSaving(true);
      setError("");
      setMessage("");

      const note = (reviewNote[id] || "").trim();
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

  return (
    <AdminShell
      title="Wallet Requests"
      breadcrumb="Wallet Requests"
      titleIconClass="mdi mdi-wallet-plus-outline"
    >
      <div className="col-lg-12">
        <div className="card">
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
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
                  className="form-control"
                  placeholder="Search by requester name/email"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            {message ? <p className="text-success">{message}</p> : null}
            {error ? <p className="text-danger">{error}</p> : null}

            <div className="table-responsive">
              <table className="table table-bordered mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Requester</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Review Note</th>
                    <th>Created At</th>
                    <th>Reviewed At</th>
                    <th style={{ minWidth: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-3">
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
                          <td>{item.amount}</td>
                          <td>{item.description || "-"}</td>
                          <td>
                            <span className={statusBadgeClass(item.status)}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.review_note || "-"}</td>
                          <td>{formatDateTime(item.created_at)}</td>
                          <td>{formatDateTime(item.reviewed_at)}</td>
                          <td>
                            {item.status === "pending" ? (
                              <>
                                <textarea
                                  className="form-control mb-2"
                                  rows={2}
                                  placeholder="Review note (required for reject)"
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
                      <td colSpan={9} className="text-center py-3">
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
