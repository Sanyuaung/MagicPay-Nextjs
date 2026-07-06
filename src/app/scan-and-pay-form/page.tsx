"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { apiGet } from "@/lib/browser-api";

function ScanAndPayFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrContent = searchParams.get("qrContent") || "";
  const { profile } = useProfile();
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const normalizePhone = (value: string) => value.replace(/\D/g, "");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await apiGet<{
          data: {
            receiver: { phone: string };
            amount: string | null;
            note: string | null;
          };
        }>(`/api/scan-and-pay-form?qrContent=${encodeURIComponent(qrContent)}`);
        setReceiver(normalizePhone(res.data.receiver.phone || ""));
        setAmount(res.data.amount || "");
        setNote(res.data.note || "");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Invalid QR content");
      }
    };
    if (qrContent) {
      void run().catch(() => undefined);
    }
  }, [qrContent]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedReceiver = normalizePhone(receiver);
    const amountNumber = Number(amount);
    const trimmedNote = note.trim();

    if (!normalizedReceiver) {
      setMessage("Receiver phone is required.");
      return;
    }
    if (!Number.isFinite(amountNumber) || amountNumber < 1000) {
      setMessage("Amount must be at least 1000 MMK.");
      return;
    }
    if (!trimmedNote) {
      setMessage("Notes are required.");
      return;
    }

    try {
      const params = new URLSearchParams({
        receiver: normalizedReceiver,
        amount: String(amountNumber),
        notes: trimmedNote,
      });
      router.push(`/transfer?${params.toString()}`);
    } catch {
      setMessage("Unable to continue to transfer page. Please try again.");
    }
  };

  return (
    <MobileShell
      title="Scan and Pay Form"
      backHref="/scan-and-pay"
      notifications={profile?.unReadNotifications || 0}
    >
      <div className="account-pages">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-6">
            <div className="card overflow-hidden bg-theme text-white">
              <div className="card-body p-4">
                <form onSubmit={submit}>
                  <div className="mb-4">
                    <label className="form-label">To</label>
                    <input
                      className="form-control"
                      value={receiver}
                      onChange={(e) =>
                        setReceiver(normalizePhone(e.target.value))
                      }
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Amount (MMK)</label>
                    <input
                      className="form-control"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Add Notes</label>
                    <textarea
                      className="form-control"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      required
                    />
                  </div>
                  {message ? <p className="text-warning">{message}</p> : null}
                  <button
                    className="btn btn-theme w-md waves-effect waves-light"
                    type="submit"
                  >
                    Continue
                  </button>
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
    <Suspense fallback={<div className="p-3 text-white">Loading...</div>}>
      <ScanAndPayFormContent />
    </Suspense>
  );
}
