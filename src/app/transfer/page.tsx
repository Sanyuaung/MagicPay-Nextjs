"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MobileShell } from "@/components/frontend/MobileShell";
import { PhoneTextInput } from "@/components/PhoneTextInput";
import { useProfile } from "@/components/frontend/useProfile";
import { apiPost } from "@/lib/browser-api";

function TransferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const [toPhone, setToPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const receiverParam = searchParams.get("receiver") || "";
    const amountParam = searchParams.get("amount") || "";
    const notesParam = searchParams.get("notes") || "";

    if (receiverParam) {
      setToPhone(receiverParam.replace(/\D/g, ""));
    }
    if (amountParam) {
      setAmount(amountParam);
    }
    if (notesParam) {
      setNotes(notesParam);
    }
  }, [searchParams]);

  const balanceNumber = Number(
    String(profile?.wallet_balance ?? "0").replace(/[^\d.-]/g, ""),
  );
  const formattedBalance = (
    Number.isFinite(balanceNumber) ? balanceNumber : 0
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/api/transfer-confirm", {
        receiver: toPhone,
        amount: Number(amount),
        notes,
      });
      setShowConfirm(true);
      setMessage("");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Transfer confirmation failed",
      );
    }
  };

  const complete = async () => {
    try {
      const res = await apiPost<{ data: { trx_id: string } }>(
        "/api/transfer-complete",
        {
          receiver: toPhone,
          amount: Number(amount),
          notes,
          pin_code: pinCode,
        },
      );
      router.push(`/transaction/${res.data.trx_id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Transfer failed");
    }
  };

  return (
    <MobileShell
      title="Transfer"
      backHref="/"
      notifications={profile?.unReadNotifications || 0}
    >
      <div className="account-pages">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-6">
            <div className="card overflow-hidden bg-theme text-white">
              <div className="card-body p-4">
                <form onSubmit={confirm}>
                  <div className="mb-4">
                    <label className="form-label">From</label>
                    <p className="text-white-50 mb-0">{profile?.name}</p>
                    <p className="text-white-50">{profile?.phone}</p>
                  </div>
                  <hr />
                  <div className="mb-4">
                    <label className="form-label">To</label>
                    <PhoneTextInput
                      className="form-control"
                      placeholder="Please enter phone number"
                      value={toPhone}
                      onValueChange={setToPhone}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Amount (MMK)</label>
                    <input
                      className="form-control"
                      type="number"
                      placeholder="Please enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    <div className="text-white-50 available-balance d-flex justify-content-between align-items-center mt-2">
                      <small>Available Balance</small>
                      <div className="d-flex align-items-center">
                        <small id="balance-text">
                          {showBalance
                            ? `${formattedBalance} MMK`
                            : "****** MMK"}
                        </small>
                        <i
                          id="toggle-icon"
                          className={`mdi ${
                            showBalance ? "mdi-eye" : "mdi-eye-off"
                          } ms-2`}
                          style={{
                            cursor: "pointer",
                          }}
                          onClick={() => setShowBalance((prev) => !prev)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Add Notes</label>
                    <textarea
                      className="form-control"
                      placeholder="Please add notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                    />
                  </div>
                  {showConfirm ? (
                    <div className="mb-4">
                      <label className="form-label">Confirm PIN</label>
                      <input
                        className="form-control"
                        type="password"
                        maxLength={6}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-theme mt-3"
                        onClick={complete}
                      >
                        Confirm Transfer
                      </button>
                    </div>
                  ) : null}
                  {message ? <p className="text-warning">{message}</p> : null}
                  {!showConfirm ? (
                    <button
                      className="btn btn-theme w-md waves-effect waves-light"
                      type="submit"
                    >
                      Continue
                    </button>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="route-skeleton" role="status" aria-live="polite">
          <div className="route-skeleton-shell">
            <div className="route-skeleton-card">
              <div className="route-skeleton-line w-40" />
              <div className="route-skeleton-line w-70 no-margin" />
            </div>

            <div className="route-skeleton-card">
              <div className="route-skeleton-line w-90" />
              <div className="route-skeleton-line w-85" />
              <div className="route-skeleton-line w-80 no-margin" />
            </div>

            <div className="route-skeleton-card">
              <div className="route-skeleton-line w-90" />
              <div className="route-skeleton-box no-margin" />
            </div>
          </div>
        </div>
      }
    >
      <TransferContent />
    </Suspense>
  );
}
