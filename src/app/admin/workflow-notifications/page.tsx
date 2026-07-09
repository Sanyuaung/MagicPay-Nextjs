"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiGet, apiPost } from "@/lib/browser-api";

type AdminProfile = {
  role: string;
};

type WorkflowNotice = {
  id: string;
  amount: string;
  status: "pending" | "approved" | "rejected" | string;
  requester_name: string;
  requester_email: string;
  reviewer_name: string;
  reviewer_email: string;
  review_note: string;
  is_aging_pending: boolean;
  is_high_amount: boolean;
  created_at: string | null;
  reviewed_at: string | null;
  updated_at: string | null;
};

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type RiskSummary = {
  high_amount: number;
  aging_pending: number;
};

type RiskThresholds = {
  high_amount: number;
  aging_pending_hours: number;
};

export default function WorkflowNotificationsPage() {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [items, setItems] = useState<WorkflowNotice[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [riskSummary, setRiskSummary] = useState<RiskSummary>({
    high_amount: 0,
    aging_pending: 0,
  });
  const [riskThresholds, setRiskThresholds] = useState<RiskThresholds>({
    high_amount: 500000,
    aging_pending_hours: 48,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
    try {
      setIsLoading(true);
      setError("");
      setMessage("");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (status.trim()) params.set("status", status.trim());
      if (search.trim()) params.set("search", search.trim());
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      params.set("riskHighAmount", String(riskThresholds.high_amount));
      params.set("riskAgingHours", String(riskThresholds.aging_pending_hours));

      const res = await apiGet<{
        data?: {
          items?: WorkflowNotice[];
          pagination?: PaginationState;
          risk_summary?: RiskSummary;
          risk_thresholds?: RiskThresholds;
        };
      }>(`/api/admin/wallet-request-notifications?${params.toString()}`);

      setItems(res.data?.items || []);
      setRiskSummary(
        res.data?.risk_summary || {
          high_amount: 0,
          aging_pending: 0,
        },
      );
      setRiskThresholds(
        res.data?.risk_thresholds || {
          high_amount: 500000,
          aging_pending_hours: 48,
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
    } catch (err) {
      setItems([]);
      setRiskSummary({ high_amount: 0, aging_pending: 0 });
      setPagination({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
      setError(err instanceof Error ? err.message : "Failed to load notices.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    void load();
  }, [
    status,
    search,
    fromDate,
    toDate,
    page,
    pageSize,
    riskThresholds.high_amount,
    riskThresholds.aging_pending_hours,
  ]);

  useEffect(() => {
    setPage(1);
  }, [status, search, fromDate, toDate]);

  const statusBadgeClass = (value: string) => {
    if (value === "approved") return "badge bg-success";
    if (value === "rejected") return "badge bg-danger";
    return "badge bg-warning text-dark";
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
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportFile = async (type: "csv" | "pdf") => {
    try {
      setIsExporting(true);
      setError("");

      const params = new URLSearchParams();
      if (status.trim()) params.set("status", status.trim());
      if (search.trim()) params.set("search", search.trim());
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      params.set("riskHighAmount", String(riskThresholds.high_amount));
      params.set("riskAgingHours", String(riskThresholds.aging_pending_hours));
      params.set("export", type);

      const res = await fetch(
        `/api/admin/wallet-request-notifications?${params.toString()}`,
      );
      if (!res.ok) {
        throw new Error(`Unable to export ${type.toUpperCase()}.`);
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `workflow-notifications-${new Date().toISOString().slice(0, 10)}.${type}`;
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

  const formatDateTime = (value: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminShell
      title="Workflow Notifications"
      breadcrumb="Workflow Notifications"
      titleIconClass="mdi mdi-bell-ring-outline"
    >
      <div className="col-lg-12">
        <div className="card">
          <div className="card-body">
            <div className="row g-3 mb-3">
              <div className="col-12">
                <div className="row g-2">
                  <div className="col-md-6">
                    <div className="alert alert-info mb-0 py-2">
                      High Amount Alerts:{" "}
                      <strong>{riskSummary.high_amount}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="alert alert-warning mb-0 py-2">
                      Aging Pending Alerts:{" "}
                      <strong>{riskSummary.aging_pending}</strong>
                    </div>
                  </div>
                </div>
              </div>

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
              <div className="col-md-3">
                <label className="form-label">Search</label>
                <input
                  className="form-control"
                  placeholder="Requester email/name or note"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">From</label>
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">To</label>
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Risk High Amount</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  value={riskThresholds.high_amount}
                  onChange={(event) =>
                    setRiskThresholds((prev) => ({
                      ...prev,
                      high_amount: Math.max(1, Number(event.target.value) || 1),
                    }))
                  }
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Aging Hours</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  value={riskThresholds.aging_pending_hours}
                  onChange={(event) =>
                    setRiskThresholds((prev) => ({
                      ...prev,
                      aging_pending_hours: Math.max(
                        1,
                        Number(event.target.value) || 1,
                      ),
                    }))
                  }
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setStatus("");
                    setSearch("");
                    setFromDate("");
                    setToDate("");
                    setRiskThresholds({
                      high_amount: 500000,
                      aging_pending_hours: 48,
                    });
                  }}
                >
                  Reset
                </button>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-outline-success w-100"
                  disabled={isExporting}
                  onClick={() => {
                    void exportFile("csv").catch(() => undefined);
                  }}
                >
                  {isExporting ? "Exporting..." : "Export CSV"}
                </button>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  disabled={isExporting}
                  onClick={() => {
                    void exportFile("pdf").catch(() => undefined);
                  }}
                >
                  {isExporting ? "Exporting..." : "Export PDF"}
                </button>
              </div>
            </div>

            {message ? <p className="text-success">{message}</p> : null}
            {error ? <p className="text-danger">{error}</p> : null}

            <div className="table-responsive">
              <table className="table table-bordered table-sm mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Requester</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Review Note</th>
                    <th>Reviewer</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-3">
                        Loading notifications...
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading
                    ? items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>
                            <div>{item.requester_name}</div>
                            <small className="text-muted">
                              {item.requester_email}
                            </small>
                          </td>
                          <td>
                            <div>{item.amount}</div>
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {item.is_high_amount ? (
                                <span className="badge bg-light text-dark border">
                                  High amount
                                </span>
                              ) : null}
                              {item.is_aging_pending ? (
                                <span className="badge bg-light text-dark border">
                                  Aging pending
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <span className={statusBadgeClass(item.status)}>
                              {item.status}
                            </span>
                          </td>
                          <td>{item.review_note || "-"}</td>
                          <td>
                            {item.reviewer_name
                              ? `${item.reviewer_name} (${item.reviewer_email})`
                              : "-"}
                          </td>
                          <td>{formatDateTime(item.updated_at)}</td>
                          <td>
                            {isSuperAdmin && item.status === "pending" ? (
                              <div>
                                <textarea
                                  className="form-control form-control-sm mb-2"
                                  rows={2}
                                  placeholder="Approval note / reject reason"
                                  value={reviewNote[item.id] || ""}
                                  onChange={(event) =>
                                    setReviewNote((prev) => ({
                                      ...prev,
                                      [item.id]: event.target.value,
                                    }))
                                  }
                                />
                                <div className="d-flex gap-1 flex-wrap">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success"
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
                                    className="btn btn-sm btn-danger"
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
                                  <Link
                                    href="/admin/admin-wallet-request"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    Open Queue
                                  </Link>
                                </div>
                              </div>
                            ) : (
                              <Link
                                href="/admin/admin-wallet-request"
                                className="btn btn-sm btn-outline-primary"
                              >
                                Open Queue
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))
                    : null}

                  {!isLoading && items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-3">
                        {error
                          ? "Unable to load notifications."
                          : "No notifications found."}
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
                  {[10, 25, 50].map((size) => (
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
                  className={`page-item ${pagination.page <= 1 || isLoading ? "disabled" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </button>
                </li>
                <li className="page-item active">
                  <button type="button" className="page-link" disabled>
                    {pagination.page}
                  </button>
                </li>
                <li
                  className={`page-item ${pagination.page >= pagination.totalPages || isLoading ? "disabled" : ""}`}
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
