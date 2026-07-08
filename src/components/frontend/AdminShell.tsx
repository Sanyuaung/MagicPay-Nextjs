"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode, useEffect, useRef, useState } from "react";

import { apiGet, apiPost } from "@/lib/browser-api";

function AdminToastReader({
  pathname,
  onResolve,
}: {
  pathname: string;
  onResolve: (
    message: string,
    type: "success" | "error",
    nextUrl: string,
  ) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get("toast");
    if (!message) return;

    const nextType = searchParams.get("toastType");
    const type = nextType === "error" ? "error" : "success";

    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    params.delete("toastType");
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    onResolve(message, type, nextUrl);
  }, [onResolve, pathname, searchParams]);

  return null;
}

export function AdminShell({
  title,
  children,
  createHref,
  cancelHref,
  breadcrumb,
  breadcrumbCurrent,
  breadcrumbSingle,
  titleIconClass,
}: {
  title: string;
  children: ReactNode;
  createHref?: string;
  cancelHref?: string;
  breadcrumb?: string;
  breadcrumbCurrent?: string;
  breadcrumbSingle?: boolean;
  titleIconClass?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [adminRole, setAdminRole] = useState<string>("");
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Magic Pay";

  useEffect(() => {
    document.body.setAttribute("data-sidebar", "dark");
    return () => {
      document.body.removeAttribute("data-sidebar");
      document.body.removeAttribute("data-sidebar-size");
      document.body.classList.remove("vertical-collpsed");
      document.body.classList.remove("sidebar-enable");
    };
  }, []);

  useEffect(() => {
    if (!isDesktopCollapsed) {
      document.body.classList.remove("vertical-collpsed");
      document.body.removeAttribute("data-sidebar-size");
      return;
    }

    document.body.classList.add("vertical-collpsed");
    document.body.setAttribute("data-sidebar-size", "small");
  }, [isDesktopCollapsed]);

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.classList.add("sidebar-enable");
      return;
    }

    document.body.classList.remove("sidebar-enable");
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => {
      setToastMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toastMessage]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await apiGet<{ data?: { role?: string } }>(
          "/api/admin/profile",
        );
        setAdminRole(res.data?.role || "");
      } catch {
        setAdminRole("");
      }
    };

    void run().catch(() => undefined);
  }, []);

  const isCreateOrEdit =
    pathname.includes("/create") ||
    pathname.includes("/edit") ||
    pathname.includes("/add-amount") ||
    pathname.includes("/reduce-amount");

  const breadcrumbParent = breadcrumb?.trim() || "";
  const breadcrumbTitle = (breadcrumbCurrent || title).trim();
  const showCurrentTitleCrumb =
    Boolean(breadcrumbParent) &&
    breadcrumbParent.toLowerCase() !== breadcrumbTitle.toLowerCase();

  const breadcrumbParentHref = (() => {
    if (pathname.endsWith("/create")) {
      return pathname.replace(/\/create$/, "");
    }
    if (pathname.endsWith("/add-amount")) {
      return pathname.replace(/\/add-amount$/, "");
    }
    if (pathname.endsWith("/reduce-amount")) {
      return pathname.replace(/\/reduce-amount$/, "");
    }
    if (/\/[^/]+\/edit$/.test(pathname)) {
      return pathname.replace(/\/[^/]+\/edit$/, "");
    }
    return undefined;
  })();

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  const logout = async () => {
    try {
      await apiPost("/api/admin/logout", {});
    } catch {
      // noop
    }
    router.push("/admin/login");
  };

  const onToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }

    setIsDesktopCollapsed((prev) => !prev);
  };

  return (
    <div id="layout-wrapper">
      <header id="page-topbar">
        <div className="navbar-header">
          <div className="d-flex admin-topbar-left">
            <button
              type="button"
              className="btn btn-sm font-size-24 header-item waves-effect admin-menu-toggle-btn"
              id="vertical-menu-btn"
              onClick={onToggleSidebar}
            >
              <i className="mdi mdi-menu" />
            </button>

            <div className="navbar-brand-box">
              <Link
                href="/admin"
                className="admin-brand-link"
                title="Admin Dashboard"
                aria-label="Admin Dashboard"
              >
                <img
                  src="/backend/assets/images/logo-sm.png"
                  alt={appName}
                  className="admin-brand-logo"
                  height="24"
                />
                <span className="admin-brand-text">{appName}</span>
              </Link>
            </div>

            <div className="admin-header-action-wrap">
              {createHref && !isCreateOrEdit ? (
                <Link
                  className="btn btn-success admin-header-action-btn"
                  href={createHref}
                  title="Add New"
                >
                  <i className="ion ion-md-add-circle" />
                </Link>
              ) : null}
              {cancelHref && isCreateOrEdit ? (
                <Link
                  className="btn btn-dark admin-header-action-btn"
                  href={cancelHref}
                  title="Cancel"
                >
                  <i className="dripicons-reply" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="d-flex admin-topbar-right">
            <div className="dropdown d-inline-block" ref={profileMenuRef}>
              <button
                type="button"
                className="btn header-item waves-effect"
                aria-haspopup="true"
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              >
                <img
                  className="rounded-circle header-profile-user"
                  src="https://ui-avatars.com/api/?name=Admin"
                  alt="Admin"
                />
              </button>
              <div
                className={`dropdown-menu dropdown-menu-end ${
                  isProfileMenuOpen ? "show" : ""
                }`}
              >
                <Link
                  className="dropdown-item"
                  href="/admin/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <i className="mdi mdi-account-circle font-size-17 align-middle me-1" />
                  Profile
                </Link>
                <Link
                  className="dropdown-item"
                  href="/admin/my-wallet"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <i className="mdi mdi-wallet font-size-17 align-middle me-1" />
                  My Wallet
                </Link>
                <div className="dropdown-divider" />
                <button
                  type="button"
                  className="dropdown-item text-danger"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div
        className="vertical-menu"
        style={
          isMobileSidebarOpen
            ? {
                top: "0px",
                height: "100vh",
                zIndex: 1101,
              }
            : undefined
        }
      >
        <div data-simplebar className="h-100">
          <div className="admin-sidebar-mobile-head">
            <div className="admin-sidebar-mobile-brand">
              <img
                src="/backend/assets/images/logo-sm.png"
                alt={appName}
                className="admin-sidebar-mobile-logo"
                width="36"
                height="36"
              />
              <span className="admin-sidebar-mobile-app-name">{appName}</span>
            </div>
            <button
              type="button"
              className="admin-sidebar-close-btn"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close Sidebar"
            >
              <i className="mdi mdi-close" />
            </button>
          </div>
          <div id="sidebar-menu">
            <ul className="metismenu list-unstyled" id="side-menu">
              <li className="menu-title">Main</li>
              {adminRole === "super_admin" ? (
                <>
                  <li
                    className={isActive("/admin/admin-user") ? "mm-active" : ""}
                  >
                    <Link href="/admin/admin-user" className="waves-effect">
                      <i className="fas fa-users-cog" />
                      <span>Admin Users</span>
                    </Link>
                  </li>
                  <li
                    className={
                      isActive("/admin/admin-wallet-request") ? "mm-active" : ""
                    }
                  >
                    <Link
                      href="/admin/admin-wallet-request"
                      className="waves-effect"
                    >
                      <i className="mdi mdi-wallet-plus-outline" />
                      <span>Wallet Requests</span>
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className={isActive("/admin") ? "mm-active" : ""}>
                    <Link href="/admin" className="waves-effect">
                      <i className="ti-home" />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li className={isActive("/admin/user") ? "mm-active" : ""}>
                    <Link href="/admin/user" className="waves-effect">
                      <i className="ion ion-md-people" />
                      <span>Users</span>
                    </Link>
                  </li>
                  <li className={isActive("/admin/wallet") ? "mm-active" : ""}>
                    <Link href="/admin/wallet" className="waves-effect">
                      <i className="ti-wallet" />
                      <span>Wallets</span>
                    </Link>
                  </li>
                  <li
                    className={
                      isActive("/admin/send-information") ? "mm-active" : ""
                    }
                  >
                    <Link
                      href="/admin/send-information"
                      className="waves-effect"
                    >
                      <i className="mdi mdi-bell-ring-outline" />
                      <span>Send Informations</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
      {isMobileSidebarOpen ? (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close Sidebar"
        />
      ) : null}
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <Suspense fallback={null}>
              <AdminToastReader
                pathname={pathname}
                onResolve={(message, type, nextUrl) => {
                  setToastType(type);
                  setToastMessage(message);
                  router.replace(nextUrl, { scroll: false });
                }}
              />
            </Suspense>
            {toastMessage ? (
              <div
                className={`admin-toast admin-toast-${toastType}`}
                role="alert"
              >
                {toastMessage}
                <button
                  type="button"
                  className="admin-toast-close"
                  onClick={() => setToastMessage("")}
                >
                  ×
                </button>
              </div>
            ) : null}
            <div className="page-title-box">
              <div className="row align-items-center admin-page-title-row">
                <div className="col-md-8 admin-page-title-col">
                  <h6 className="page-title">
                    {titleIconClass ? <i className={titleIconClass} /> : null}{" "}
                    {title}
                  </h6>
                  {breadcrumb ? (
                    <ol className="breadcrumb m-0 admin-breadcrumb">
                      {breadcrumbSingle ? (
                        <li
                          className="breadcrumb-item admin-breadcrumb-item active"
                          aria-current="page"
                        >
                          {breadcrumbParent}
                        </li>
                      ) : (
                        <>
                          <li className="breadcrumb-item admin-breadcrumb-item">
                            <Link href="/admin">Dashboard</Link>
                          </li>
                          <li
                            className={`breadcrumb-item admin-breadcrumb-item ${
                              showCurrentTitleCrumb ? "" : "active"
                            }`}
                            aria-current={
                              showCurrentTitleCrumb ? undefined : "page"
                            }
                          >
                            {showCurrentTitleCrumb && breadcrumbParentHref ? (
                              <Link href={breadcrumbParentHref}>
                                {breadcrumbParent}
                              </Link>
                            ) : (
                              breadcrumbParent
                            )}
                          </li>
                          {showCurrentTitleCrumb ? (
                            <li
                              className="breadcrumb-item admin-breadcrumb-item active"
                              aria-current="page"
                            >
                              {breadcrumbTitle}
                            </li>
                          ) : null}
                        </>
                      )}
                    </ol>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="row">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
