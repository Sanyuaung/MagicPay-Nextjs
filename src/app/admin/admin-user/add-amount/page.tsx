"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiGet, apiPost } from "@/lib/browser-api";
import { withAdminToast } from "@/lib/admin-toast";

type AdminUser = {
  id: string;
  name: string;
  phone: string;
};

type AdminWalletItem = {
  amount: string;
  admin_user?: { id: string } | null;
};

type ListData<T> = T[] | { items?: T[] };

function extractItems<T>(data: ListData<T> | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export default function AdminUserWalletAddAmountPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [walletAmountByAdminId, setWalletAmountByAdminId] = useState<
    Record<string, string>
  >({});
  const [adminUserId, setAdminUserId] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [isAdminsLoading, setIsAdminsLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const adminMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const [adminsRes, walletsRes] = await Promise.all([
          apiGet<{ data?: { items?: AdminUser[] } }>(
            "/api/admin/admin-users?page=1&pageSize=200",
          ),
          apiGet<{ data?: ListData<AdminWalletItem> }>(
            "/api/admin/admin-wallets?page=1&pageSize=200",
          ),
        ]);

        const adminItems = adminsRes.data?.items || [];
        setAdmins(adminItems);

        const walletItems = extractItems(walletsRes.data);
        const mapped = Object.fromEntries(
          walletItems
            .filter((wallet) => wallet.admin_user?.id)
            .map((wallet) => [
              wallet.admin_user!.id,
              Number(wallet.amount || 0).toFixed(2),
            ]),
        );
        setWalletAmountByAdminId(mapped);
      } finally {
        setIsAdminsLoading(false);
      }
    };

    void run().catch(() => undefined);
  }, []);

  const sortedAdmins = [...admins].sort((a, b) => Number(a.id) - Number(b.id));

  const adminOptions = useMemo(
    () =>
      sortedAdmins.map((admin) => ({
        id: admin.id,
        label: `${admin.name} (${admin.phone}) ~ ${walletAmountByAdminId[admin.id] || "0.00"} MMK`,
      })),
    [sortedAdmins, walletAmountByAdminId],
  );

  const filteredAdminOptions = adminOptions.filter((option) =>
    option.label.toLowerCase().includes(adminSearch.trim().toLowerCase()),
  );

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!adminMenuRef.current?.contains(target)) {
        setShowAdminMenu(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (!adminUserId) {
        setMessage("The admin users list field is required.");
        return;
      }
      if (!amount.trim()) {
        setMessage("The amount field is required.");
        return;
      }

      await apiPost("/api/admin/admin-wallets/add-amount", {
        admin_user_id: adminUserId,
        amount,
        description,
      });

      router.push(
        withAdminToast(
          "/admin/admin-user",
          "Admin wallet amount added successfully.",
        ),
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Add amount failed");
    }
  };

  return (
    <AdminShell
      title="Add Amount"
      breadcrumb="Admin Users"
      cancelHref="/admin/admin-user"
      titleIconClass="fas fa-users-cog"
    >
      <div className="col-lg-12">
        <div className="card">
          <div className="card-body">
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Admin Users List</label>
                <div className="wallet-user-search" ref={adminMenuRef}>
                  <input
                    className="form-control"
                    placeholder="---- Please Choose ----"
                    value={adminSearch}
                    onFocus={() => setShowAdminMenu(true)}
                    onChange={(event) => {
                      setAdminSearch(event.target.value);
                      setAdminUserId("");
                      setShowAdminMenu(true);
                    }}
                  />
                  {showAdminMenu ? (
                    <div className="wallet-user-search-menu">
                      {isAdminsLoading ? (
                        <div className="wallet-user-search-empty">
                          Loading admin users...
                        </div>
                      ) : filteredAdminOptions.length ? (
                        filteredAdminOptions.map((option) => (
                          <button
                            type="button"
                            key={option.id}
                            className={`wallet-user-search-item ${
                              adminUserId === option.id ? "is-selected" : ""
                            }`}
                            onClick={() => {
                              setAdminUserId(option.id);
                              setAdminSearch(option.label);
                              setShowAdminMenu(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))
                      ) : (
                        <div className="wallet-user-search-empty">
                          No admin users found
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Amount</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  placeholder="Enter add amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Enter description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              {message ? <p className="text-danger">{message}</p> : null}

              <button className="btn btn-theme" type="submit">
                Save
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
