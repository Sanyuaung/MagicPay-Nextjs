"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiGet, apiPost } from "@/lib/browser-api";

type MyWallet = {
  admin_user_id: string;
  admin_role: string;
  linked_user: boolean;
  account_person: string;
  account_number: string | null;
  amount: string;
  updated_at: string | null;
};

type AddAmountRequest = {
  id: string;
  amount: string;
  description: string;
  status: "pending" | "approved" | "rejected" | string;
  review_note: string;
  reviewed_at: string | null;
  reviewer: {
    id: string;
    name: string;
    email: string;
  } | null;
  created_at: string | null;
  updated_at: string | null;
};

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function MyWalletPage() {
  const [wallet, setWallet] = useState<MyWallet | null>(null);
  const [requests, setRequests] = useState<AddAmountRequest[]>([]);
  const [requestPage, setRequestPage] = useState(1);
  const [requestPageSize, setRequestPageSize] = useState(10);
  const [requestStatusFilter, setRequestStatusFilter] = useState("");
  const [requestFromDate, setRequestFromDate] = useState("");
  const [requestToDate, setRequestToDate] = useState("");
  const [requestPagination, setRequestPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [isRequestSaving, setIsRequestSaving] = useState(false);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await apiGet<{ data: MyWallet }>("/api/admin/my-wallet");
      setWallet(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async () => {
    if (wallet?.admin_role === "super_admin") {
      setRequests([]);
      return;
    }

    try {
      setIsRequestLoading(true);
      const params = new URLSearchParams({
        page: String(requestPage),
        pageSize: String(requestPageSize),
      });
      if (requestStatusFilter.trim()) {
        params.set("status", requestStatusFilter.trim());
      }
      if (requestFromDate) {
        params.set("from", requestFromDate);
      }
      if (requestToDate) {
        params.set("to", requestToDate);
      }
      const res = await apiGet<{
        data: { items: AddAmountRequest[]; pagination: PaginationState };
      }>(`/api/admin/my-wallet/add-amount-requests?${params.toString()}`);
      setRequests(res.data?.items || []);
      setRequestPagination(
        res.data?.pagination || {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to load requests",
      );
      setRequests([]);
      setRequestPagination({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
    } finally {
      setIsRequestLoading(false);
    }
  };

  useEffect(() => {
    void loadWallet().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!wallet) return;
    void loadRequests().catch(() => undefined);
  }, [
    wallet?.admin_role,
    requestPage,
    requestPageSize,
    requestStatusFilter,
    requestFromDate,
    requestToDate,
  ]);

  useEffect(() => {
    setRequestPage(1);
  }, [requestStatusFilter, requestFromDate, requestToDate]);

  const submitAmountAction = async (mode: "add" | "reduce") => {
    if (!wallet?.admin_user_id) return;

    try {
      setActionError("");
      setActionMessage("");
      setIsSaving(true);

      if (!amount.trim()) {
        setActionError("The amount field is required.");
        return;
      }

      const endpoint =
        mode === "add"
          ? "/api/admin/admin-wallets/add-amount"
          : "/api/admin/admin-wallets/reduce-amount";

      await apiPost(endpoint, {
        admin_user_id: wallet.admin_user_id,
        amount,
        description,
      });

      setActionMessage(
        mode === "add"
          ? "Amount added successfully."
          : "Amount reduced successfully.",
      );
      setAmount("");
      setDescription("");
      await loadWallet();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Wallet update failed",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const submitAddAmountRequest = async () => {
    if (!wallet?.admin_user_id) return;

    try {
      setActionError("");
      setActionMessage("");
      setIsRequestSaving(true);

      if (!requestAmount.trim()) {
        setActionError("The request amount field is required.");
        return;
      }

      await apiPost("/api/admin/my-wallet/add-amount-requests", {
        amount: requestAmount,
        description: requestDescription,
      });

      setActionMessage("Request sent to super admin successfully.");
      setRequestAmount("");
      setRequestDescription("");
      setRequestPage(1);
      await loadRequests();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsRequestSaving(false);
    }
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("sv-SE", { hour12: false });
  };

  const statusBadgeClass = (status: string) => {
    if (status === "approved") return "badge bg-success";
    if (status === "rejected") return "badge bg-danger";
    return "badge bg-warning text-dark";
  };

  const getRequestPaginationButtons = () => {
    const totalPages = requestPagination.totalPages;
    const current = requestPagination.page;
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

  const recentRequestUpdates = requests.filter(
    (item) => item.status === "approved" || item.status === "rejected",
  );

  return (
    <AdminShell
      title="My Wallet"
      breadcrumb="My Wallet"
      titleIconClass="ti-wallet"
    >
      <div className="col-lg-12">
        <div className="card">
          <div className="card-body">
            {isLoading ? <p className="mb-0">Loading wallet...</p> : null}

            {error ? <p className="text-danger mb-0">{error}</p> : null}

            {!isLoading && !error && wallet ? (
              <div>
                <div className="table-responsive mb-4">
                  <table className="table table-bordered mb-0">
                    <tbody>
                      <tr>
                        <th style={{ width: 220 }}>Account Person</th>
                        <td>{wallet.account_person || "-"}</td>
                      </tr>
                      <tr>
                        <th>Account Number</th>
                        <td>{wallet.account_number || "-"}</td>
                      </tr>
                      <tr>
                        <th>Balance (MMK)</th>
                        <td>{wallet.amount}</td>
                      </tr>
                      <tr>
                        <th>Last Updated</th>
                        <td>{formatDateTime(wallet.updated_at)}</td>
                      </tr>
                      <tr>
                        <th>Status</th>
                        <td>
                          {wallet.linked_user
                            ? "Active admin wallet"
                            : "Wallet not ready"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {wallet.admin_role === "super_admin" ? (
                  <>
                    <h5 className="mb-3">Wallet Actions</h5>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Amount</label>
                        <input
                          className="form-control"
                          type="number"
                          min={1}
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                        />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label">
                          Description (optional)
                        </label>
                        <input
                          className="form-control"
                          placeholder="Enter description"
                          value={description}
                          onChange={(event) =>
                            setDescription(event.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn-success"
                        disabled={isSaving}
                        onClick={() => {
                          void submitAmountAction("add").catch(() => undefined);
                        }}
                      >
                        Add Amount
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={isSaving}
                        onClick={() => {
                          void submitAmountAction("reduce").catch(
                            () => undefined,
                          );
                        }}
                      >
                        Reduce Amount
                      </button>
                    </div>

                    {actionMessage ? (
                      <p className="text-success mb-0 mt-3">{actionMessage}</p>
                    ) : null}
                    {actionError ? (
                      <p className="text-danger mb-0 mt-3">{actionError}</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <h5 className="mb-3">Request Add Amount</h5>
                    <p className="text-muted mb-3">
                      Send request to super admin. Your wallet balance will be
                      updated only after approval.
                    </p>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">Request Amount</label>
                        <input
                          className="form-control"
                          type="number"
                          min={1}
                          placeholder="Enter amount"
                          value={requestAmount}
                          onChange={(event) =>
                            setRequestAmount(event.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label">Description</label>
                        <input
                          className="form-control"
                          placeholder="Enter description"
                          value={requestDescription}
                          onChange={(event) =>
                            setRequestDescription(event.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn-success"
                        disabled={isRequestSaving}
                        onClick={() => {
                          void submitAddAmountRequest().catch(() => undefined);
                        }}
                      >
                        Send Request
                      </button>
                    </div>

                    {actionMessage ? (
                      <p className="text-success mb-0 mt-3">{actionMessage}</p>
                    ) : null}
                    {actionError ? (
                      <p className="text-danger mb-0 mt-3">{actionError}</p>
                    ) : null}

                    <hr className="my-4" />

                    <h5 className="mb-3">My Top-up Request Timeline</h5>

                    {recentRequestUpdates.length > 0 ? (
                      <div className="alert alert-info py-2" role="alert">
                        Latest updates: {recentRequestUpdates.length} reviewed
                        request{recentRequestUpdates.length > 1 ? "s" : ""}
                        on this page.
                      </div>
                    ) : null}

                    <div className="row g-3 mb-3">
                      <div className="col-md-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={requestStatusFilter}
                          onChange={(event) =>
                            setRequestStatusFilter(event.target.value)
                          }
                        >
                          <option value="">All</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">From Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={requestFromDate}
                          onChange={(event) =>
                            setRequestFromDate(event.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">To Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={requestToDate}
                          onChange={(event) =>
                            setRequestToDate(event.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-3 d-flex align-items-end">
                        <button
                          type="button"
                          className="btn btn-outline-secondary w-100"
                          onClick={() => {
                            setRequestStatusFilter("");
                            setRequestFromDate("");
                            setRequestToDate("");
                          }}
                        >
                          Reset Filters
                        </button>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-bordered mb-0">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Amount</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Review Note</th>
                            <th>Reviewed By</th>
                            <th>Reviewed At</th>
                            <th>Created At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isRequestLoading ? (
                            <tr>
                              <td colSpan={8} className="text-center py-3">
                                Loading requests...
                              </td>
                            </tr>
                          ) : null}
                          {!isRequestLoading
                            ? requests.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.id}</td>
                                  <td>{item.amount}</td>
                                  <td>{item.description || "-"}</td>
                                  <td>
                                    <span
                                      className={statusBadgeClass(item.status)}
                                    >
                                      {item.status}
                                    </span>
                                  </td>
                                  <td>{item.review_note || "-"}</td>
                                  <td>
                                    {item.reviewer
                                      ? `${item.reviewer.name} (${item.reviewer.email})`
                                      : "-"}
                                  </td>
                                  <td>{formatDateTime(item.reviewed_at)}</td>
                                  <td>{formatDateTime(item.created_at)}</td>
                                </tr>
                              ))
                            : null}
                          {!isRequestLoading && requests.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-3">
                                No requests yet.
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
                          value={requestPageSize}
                          onChange={(event) => {
                            setRequestPage(1);
                            setRequestPageSize(Number(event.target.value));
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
                          Total: {requestPagination.total}
                        </span>
                      </div>
                      <ul className="pagination pagination-sm mb-0">
                        <li
                          className={`page-item ${
                            requestPagination.page <= 1 || isRequestLoading
                              ? "disabled"
                              : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="page-link"
                            onClick={() =>
                              setRequestPage((prev) => Math.max(1, prev - 1))
                            }
                          >
                            Previous
                          </button>
                        </li>
                        {getRequestPaginationButtons().map((pageNumber) => (
                          <li
                            key={pageNumber}
                            className={`page-item ${
                              pageNumber === requestPagination.page
                                ? "active"
                                : ""
                            }`}
                          >
                            <button
                              type="button"
                              className="page-link"
                              disabled={
                                pageNumber === requestPagination.page ||
                                isRequestLoading
                              }
                              onClick={() => setRequestPage(pageNumber)}
                            >
                              {pageNumber}
                            </button>
                          </li>
                        ))}
                        <li
                          className={`page-item ${
                            requestPagination.page >=
                              requestPagination.totalPages || isRequestLoading
                              ? "disabled"
                              : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="page-link"
                            onClick={() =>
                              setRequestPage((prev) =>
                                Math.min(
                                  requestPagination.totalPages,
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
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
