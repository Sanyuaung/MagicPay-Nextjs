"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiDelete, apiGet } from "@/lib/browser-api";
import { withAdminToast } from "@/lib/admin-toast";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SortKey =
  | "name"
  | "email"
  | "phone"
  | "role"
  | "ip"
  | "user_agent"
  | "created_at"
  | "updated_at";

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
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
    name: true,
    email: true,
    phone: true,
    role: true,
    ip: true,
    userAgent: true,
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
        data: { items: AdminUser[]; pagination: PaginationState };
      }>(`/api/admin/admin-users?${params.toString()}`);
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
        err instanceof Error ? err.message : "Failed to load admin users",
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
    return new Date(value).toLocaleString("sv-SE", {
      hour12: false,
    });
  };

  const normalizeUserAgent = (ua: string | null) => {
    return ua && ua.trim() ? ua : "N/A";
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
      title="Admin Users"
      breadcrumb="Admin Users"
      createHref="/admin/admin-user/create"
      titleIconClass="fas fa-users-cog"
    >
      <div className="d-block mb-3">
        <div className="admin-wallet-action-wrap">
          <Link
            className="btn btn-success admin-wallet-action-btn"
            href="/admin/admin-user/add-amount"
            role="button"
            title="Add Amount"
          >
            <i className="typcn typcn-plus" /> Add amount to admin wallet
          </Link>
          <Link
            className="btn btn-danger admin-wallet-action-btn"
            href="/admin/admin-user/reduce-amount"
            role="button"
            title="Reduce Amount"
          >
            <i className="typcn typcn-minus" /> Reduce amount from admin wallet
          </Link>
        </div>
      </div>

      <div className="col-lg-12">
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3 admin-table-toolbar">
              <div className="column-visibility-wrap">
                <button
                  className="btn btn-secondary buttons-collection dropdown-toggle buttons-colvis column-visibility-toggle"
                  type="button"
                  onClick={() => setShowColumnMenu((prev) => !prev)}
                >
                  Column Visibility
                </button>
                {showColumnMenu ? (
                  <div className="dropdown-menu show column-visibility-menu">
                    {renderColumnToggleItem("Name", "name")}
                    {renderColumnToggleItem("Email", "email")}
                    {renderColumnToggleItem("Phone", "phone")}
                    {renderColumnToggleItem("Role", "role")}
                    {renderColumnToggleItem("IP Address", "ip")}
                    {renderColumnToggleItem("User Agent", "userAgent")}
                    {renderColumnToggleItem("Created at", "createdAt")}
                    {renderColumnToggleItem("Updated at", "updatedAt")}
                  </div>
                ) : null}
              </div>
              <div className="d-flex align-items-center gap-2 admin-table-search-wrap">
                <label className="mb-0">Search:</label>
                <input
                  className="form-control"
                  style={{ width: 200 }}
                  placeholder="Search..."
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                />
              </div>
            </div>

            {error ? <p className="text-danger">{error}</p> : null}

            <div className="table-responsive admin-table-wrap">
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
                    {visibleColumns.name ? (
                      <th>{renderSortHeader("Name", "name")}</th>
                    ) : null}
                    {visibleColumns.email ? (
                      <th>{renderSortHeader("Email", "email")}</th>
                    ) : null}
                    {visibleColumns.phone ? (
                      <th>{renderSortHeader("Phone", "phone")}</th>
                    ) : null}
                    {visibleColumns.role ? (
                      <th>{renderSortHeader("Role", "role")}</th>
                    ) : null}
                    {visibleColumns.ip ? (
                      <th>{renderSortHeader("IP Address", "ip")}</th>
                    ) : null}
                    {visibleColumns.userAgent ? (
                      <th>{renderSortHeader("User Agent", "user_agent")}</th>
                    ) : null}
                    {visibleColumns.createdAt ? (
                      <th>{renderSortHeader("Created at", "created_at")}</th>
                    ) : null}
                    {visibleColumns.updatedAt ? (
                      <th>{renderSortHeader("Updated at", "updated_at")}</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={
                          Object.values(visibleColumns).filter(Boolean)
                            .length || 1
                        }
                        className="table-loading-cell"
                      >
                        <div className="table-loading-dots">
                          <span />
                          <span />
                          <span />
                          <strong>Loading data...</strong>
                        </div>
                      </td>
                    </tr>
                  ) : null}

                  {!isLoading
                    ? items.map((item) => {
                        const visibleColCount =
                          Object.values(visibleColumns).filter(Boolean).length;
                        const isExpanded = expandedRowId === item.id;

                        return (
                          <Fragment key={item.id}>
                            <tr>
                              {visibleColumns.name ? (
                                <td className="table-type-cell">
                                  <button
                                    type="button"
                                    className={`admin-row-toggle me-2 ${
                                      isExpanded ? "is-expanded" : ""
                                    }`}
                                    onClick={() =>
                                      setExpandedRowId(
                                        isExpanded ? null : item.id,
                                      )
                                    }
                                  >
                                    <i
                                      className={`mdi ${
                                        isExpanded ? "mdi-minus" : "mdi-plus"
                                      }`}
                                    />
                                  </button>
                                  <span className="text-nowrap">
                                    {item.name}
                                  </span>
                                </td>
                              ) : null}
                              {visibleColumns.email ? (
                                <td className="text-nowrap">{item.email}</td>
                              ) : null}
                              {visibleColumns.phone ? (
                                <td className="text-nowrap">{item.phone}</td>
                              ) : null}
                              {visibleColumns.role ? (
                                <td className="text-nowrap">{item.role}</td>
                              ) : null}
                              {visibleColumns.ip ? (
                                <td className="text-nowrap">
                                  {item.ip || "N/A"}
                                </td>
                              ) : null}
                              {visibleColumns.userAgent ? (
                                <td className="text-nowrap">
                                  {normalizeUserAgent(item.user_agent)}
                                </td>
                              ) : null}
                              {visibleColumns.createdAt ? (
                                <td className="text-nowrap">
                                  {formatDateTime(item.created_at)}
                                </td>
                              ) : null}
                              {visibleColumns.updatedAt ? (
                                <td className="text-nowrap">
                                  {formatDateTime(item.updated_at)}
                                </td>
                              ) : null}
                            </tr>
                            {isExpanded ? (
                              <tr>
                                <td colSpan={visibleColCount}>
                                  <div className="py-2">
                                    <div className="fw-semibold mb-2">
                                      Action
                                    </div>
                                    <div className="action-icon">
                                      <Link
                                        className="btn btn-primary btn-sm edit"
                                        title="Edit"
                                        href={`/admin/admin-user/${item.id}/edit`}
                                      >
                                        <i className="fas fa-pencil-alt" />
                                      </Link>
                                      <button
                                        className="btn btn-danger btn-sm delete"
                                        title="Delete"
                                        onClick={async () => {
                                          const ok = window.confirm(
                                            "Are you sure you want to delete this admin user?",
                                          );
                                          if (!ok) return;
                                          await apiDelete(
                                            `/api/admin/admin-users/${item.id}`,
                                          );
                                          router.push(
                                            withAdminToast(
                                              "/admin/admin-user",
                                              "Admin user deleted successfully.",
                                            ),
                                          );
                                        }}
                                      >
                                        <i className="fas fa-trash" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })
                    : null}

                  {!isLoading && items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          Object.values(visibleColumns).filter(Boolean)
                            .length || 1
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
