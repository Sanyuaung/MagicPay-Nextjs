"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiGet, apiPost } from "@/lib/browser-api";
import { withAdminToast } from "@/lib/admin-toast";

type User = {
  id: string;
  name: string;
  phone: string;
};

type WalletItem = {
  amount: string;
  user?: { id: string } | null;
};

type ListData<T> = T[] | { items?: T[] };

function extractItems<T>(data: ListData<T> | undefined): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export default function WalletAddAmountPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [walletAmountByUserId, setWalletAmountByUserId] = useState<
    Record<string, string>
  >({});
  const [userId, setUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const [usersRes, walletsRes] = await Promise.all([
          apiGet<{ data?: ListData<User> }>("/api/admin/users"),
          apiGet<{ data?: ListData<WalletItem> }>("/api/admin/wallets"),
        ]);

        const userItems = extractItems(usersRes.data);
        setUsers(userItems);

        const walletItems = extractItems(walletsRes.data);

        const mapped = Object.fromEntries(
          walletItems
            .filter((wallet) => wallet.user?.id)
            .map((wallet) => [
              wallet.user!.id,
              Number(wallet.amount || 0).toFixed(2),
            ]),
        );
        setWalletAmountByUserId(mapped);
      } finally {
        setIsUsersLoading(false);
      }
    };
    void run().catch(() => undefined);
  }, []);

  const sortedUsers = [...users].sort((a, b) => Number(a.id) - Number(b.id));

  const userOptions = useMemo(
    () =>
      sortedUsers.map((u) => ({
        id: u.id,
        label: `${u.name} (${u.phone}) ~ ${walletAmountByUserId[u.id] || "0.00"} MMK`,
      })),
    [sortedUsers, walletAmountByUserId],
  );

  const filteredUserOptions = userOptions.filter((option) =>
    option.label.toLowerCase().includes(userSearch.trim().toLowerCase()),
  );

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!userMenuRef.current?.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!userId) {
        setMessage("The users list field is required.");
        return;
      }
      if (!amount.trim()) {
        setMessage("The amount field is required.");
        return;
      }
      await apiPost("/api/admin/wallets/add-amount", {
        user_id: userId,
        amount,
        description,
      });
      router.push(
        withAdminToast("/admin/wallet", "Wallet amount added successfully."),
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Add amount failed");
    }
  };

  return (
    <AdminShell
      title="Add Amount"
      breadcrumb="Wallets"
      cancelHref="/admin/wallet"
      titleIconClass="ti-wallet"
    >
      <div className="col-lg-12">
        <div className="card">
          <div className="card-body">
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Users List</label>
                <div className="wallet-user-search" ref={userMenuRef}>
                  <input
                    className="form-control"
                    placeholder="---- Please Choose ----"
                    value={userSearch}
                    onFocus={() => setShowUserMenu(true)}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserId("");
                      setShowUserMenu(true);
                    }}
                  />
                  {showUserMenu ? (
                    <div className="wallet-user-search-menu">
                      {isUsersLoading ? (
                        <div className="wallet-user-search-empty">
                          Loading users...
                        </div>
                      ) : filteredUserOptions.length ? (
                        filteredUserOptions.map((option) => (
                          <button
                            type="button"
                            key={option.id}
                            className={`wallet-user-search-item ${
                              userId === option.id ? "is-selected" : ""
                            }`}
                            onClick={() => {
                              setUserId(option.id);
                              setUserSearch(option.label);
                              setShowUserMenu(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))
                      ) : (
                        <div className="wallet-user-search-empty">
                          No users found
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
                  min={1000}
                  placeholder="Enter add amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
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
                  onChange={(e) => setDescription(e.target.value)}
                  required
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
