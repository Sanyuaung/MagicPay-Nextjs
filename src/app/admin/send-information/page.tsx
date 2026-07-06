"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiDelete, apiGet } from "@/lib/browser-api";
import { withAdminToast } from "@/lib/admin-toast";

type InfoItem = {
    id: string;
    type: string;
    title: string;
    message: string;
    image?: string;
    image_url?: string | null;
    web_link?: string;
    status: number;
    created_at: string | null;
    updated_at: string | null;
};

type SortKey =
    | "type"
    | "title"
    | "message"
    | "image"
    | "web_link"
    | "status"
    | "created_at"
    | "updated_at";

type PaginationState = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function SendInformationPage() {
    const router = useRouter();
    const [items, setItems] = useState<InfoItem[]>([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
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
        type: true,
        title: true,
        message: true,
        image: true,
        webLink: false,
        status: false,
        createdAt: false,
        updatedAt: false,
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
                data: { items: InfoItem[]; pagination: PaginationState };
            }>(`/api/admin/send-information?${params.toString()}`);
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
                err instanceof Error
                    ? err.message
                    : "Failed to load send informations",
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

    const renderStatusBadge = (status: number) => {
        if (status === 1) {
            return <span className="badge bg-success">Approved</span>;
        }
        return <span className="badge bg-warning">Pending</span>;
    };

    return (
        <AdminShell
            title="Send Information"
            breadcrumb="Send Information"
            createHref="/admin/send-information/create"
            titleIconClass="mdi mdi-bell-ring-outline"
        >
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
                                        {renderColumnToggleItem("Type", "type")}
                                        {renderColumnToggleItem(
                                            "Title",
                                            "title",
                                        )}
                                        {renderColumnToggleItem(
                                            "Message",
                                            "message",
                                        )}
                                        {renderColumnToggleItem(
                                            "Image",
                                            "image",
                                        )}
                                        {renderColumnToggleItem(
                                            "Web Link",
                                            "webLink",
                                        )}
                                        {renderColumnToggleItem(
                                            "Status",
                                            "status",
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
                                className="table table-striped table-bordered dt-responsive nowrap send-information-table"
                                style={{
                                    borderCollapse: "collapse",
                                    borderSpacing: 0,
                                    width: "100%",
                                }}
                            >
                                <thead>
                                    <tr>
                                        {visibleColumns.type ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Type",
                                                    "type",
                                                )}
                                            </th>
                                        ) : null}
                                        {visibleColumns.title ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Title",
                                                    "title",
                                                )}
                                            </th>
                                        ) : null}
                                        {visibleColumns.message ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Message",
                                                    "message",
                                                )}
                                            </th>
                                        ) : null}
                                        {visibleColumns.image ? (
                                            <th>Image</th>
                                        ) : null}
                                        {visibleColumns.webLink ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Web Link",
                                                    "web_link",
                                                )}
                                            </th>
                                        ) : null}
                                        {visibleColumns.status ? (
                                            <th>
                                                {renderSortHeader(
                                                    "Status",
                                                    "status",
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
                                        ? items.map((item) => {
                                              const visibleColCount =
                                                  Object.values(
                                                      visibleColumns,
                                                  ).filter(Boolean).length;
                                              const isExpanded =
                                                  expandedRowId === item.id;

                                              return (
                                                  <Fragment key={item.id}>
                                                      <tr key={item.id}>
                                                          {visibleColumns.type ? (
                                                              <td className="table-type-cell">
                                                                  <button
                                                                      type="button"
                                                                      className={`admin-row-toggle me-2 ${
                                                                          isExpanded
                                                                              ? "is-expanded"
                                                                              : ""
                                                                      }`}
                                                                      onClick={() =>
                                                                          setExpandedRowId(
                                                                              isExpanded
                                                                                  ? null
                                                                                  : item.id,
                                                                          )
                                                                      }
                                                                  >
                                                                      <i
                                                                          className={`mdi ${
                                                                              isExpanded
                                                                                  ? "mdi-minus"
                                                                                  : "mdi-plus"
                                                                          }`}
                                                                      />
                                                                  </button>
                                                                  <span className="text-nowrap">
                                                                      {
                                                                          item.type
                                                                      }
                                                                  </span>
                                                              </td>
                                                          ) : null}
                                                          {visibleColumns.title ? (
                                                              <td className="text-nowrap">
                                                                  {item.title}
                                                              </td>
                                                          ) : null}
                                                          {visibleColumns.message ? (
                                                              <td>
                                                                  {item.message}
                                                              </td>
                                                          ) : null}
                                                          {visibleColumns.image ? (
                                                              <td className="text-nowrap">
                                                                  {item.image_url ? (
                                                                      <img
                                                                          src={
                                                                              item.image_url
                                                                          }
                                                                          alt="Send information"
                                                                          width={
                                                                              100
                                                                          }
                                                                          className="img-thumbnail"
                                                                      />
                                                                  ) : (
                                                                      "-"
                                                                  )}
                                                              </td>
                                                          ) : null}
                                                          {visibleColumns.webLink ? (
                                                              <td className="text-nowrap">
                                                                  {item.web_link ||
                                                                      "-"}
                                                              </td>
                                                          ) : null}
                                                          {visibleColumns.status ? (
                                                              <td>
                                                                  {renderStatusBadge(
                                                                      item.status,
                                                                  )}
                                                              </td>
                                                          ) : null}
                                                          {visibleColumns.createdAt ? (
                                                              <td className="text-nowrap">
                                                                  {formatDateTime(
                                                                      item.created_at,
                                                                  )}
                                                              </td>
                                                          ) : null}
                                                          {visibleColumns.updatedAt ? (
                                                              <td className="text-nowrap">
                                                                  {formatDateTime(
                                                                      item.updated_at,
                                                                  )}
                                                              </td>
                                                          ) : null}
                                                      </tr>
                                                      {isExpanded ? (
                                                          <tr
                                                              key={`${item.id}-actions`}
                                                          >
                                                              <td
                                                                  colSpan={
                                                                      visibleColCount
                                                                  }
                                                              >
                                                                  <div className="py-2 send-info-expanded">
                                                                      <div className="row border-bottom py-2 mx-0">
                                                                          <div className="col-md-2 fw-semibold">
                                                                              Web
                                                                              Link
                                                                          </div>
                                                                          <div className="col-md-10 text-muted text-break">
                                                                              {item.web_link ||
                                                                                  "-"}
                                                                          </div>
                                                                      </div>
                                                                      <div className="row border-bottom py-2 mx-0">
                                                                          <div className="col-md-2 fw-semibold">
                                                                              Status
                                                                          </div>
                                                                          <div className="col-md-10">
                                                                              {renderStatusBadge(
                                                                                  item.status,
                                                                              )}
                                                                          </div>
                                                                      </div>
                                                                      <div className="row border-bottom py-2 mx-0">
                                                                          <div className="col-md-2 fw-semibold">
                                                                              Created
                                                                              at
                                                                          </div>
                                                                          <div className="col-md-10 text-nowrap">
                                                                              {formatDateTime(
                                                                                  item.created_at,
                                                                              )}
                                                                          </div>
                                                                      </div>
                                                                      <div className="row border-bottom py-2 mx-0">
                                                                          <div className="col-md-2 fw-semibold">
                                                                              Updated
                                                                              at
                                                                          </div>
                                                                          <div className="col-md-10 text-nowrap">
                                                                              {formatDateTime(
                                                                                  item.updated_at,
                                                                              )}
                                                                          </div>
                                                                      </div>
                                                                      <div className="row py-2 mx-0">
                                                                          <div className="col-md-2 fw-semibold">
                                                                              Action
                                                                          </div>
                                                                          <div className="col-md-10 action-icon">
                                                                              {item.status ===
                                                                              0 ? (
                                                                                  <Link
                                                                                      className="btn btn-primary btn-sm edit"
                                                                                      href={`/admin/send-information/${item.id}/edit`}
                                                                                      title="Edit"
                                                                                  >
                                                                                      <i className="fas fa-pencil-alt" />
                                                                                  </Link>
                                                                              ) : null}
                                                                              <button
                                                                                  className="btn btn-danger btn-sm delete"
                                                                                  title="Delete"
                                                                                  onClick={async () => {
                                                                                      const ok =
                                                                                          window.confirm(
                                                                                              "Are you sure you want to delete this send information?",
                                                                                          );
                                                                                      if (
                                                                                          !ok
                                                                                      )
                                                                                          return;
                                                                                      await apiDelete(
                                                                                          `/api/admin/send-information/${item.id}`,
                                                                                      );
                                                                                      router.push(
                                                                                          withAdminToast(
                                                                                              "/admin/send-information",
                                                                                              "Send information deleted successfully.",
                                                                                          ),
                                                                                      );
                                                                                  }}
                                                                              >
                                                                                  <i className="fas fa-trash" />
                                                                              </button>
                                                                          </div>
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
