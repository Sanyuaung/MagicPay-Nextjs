"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import QRCode from "qrcode";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { apiGet } from "@/lib/browser-api";

export default function Page() {
  const { profile } = useProfile();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [message, setMessage] = useState("");
  const [showSetAmountModal, setShowSetAmountModal] = useState(false);
  const qrSectionRef = useRef<HTMLDivElement | null>(null);
  const downloadQrRef = useRef<HTMLDivElement | null>(null);
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Laravel";

  const maskedPhone = (phone?: string) => {
    if (!phone) return "";
    if (phone.length <= 4) return phone;
    return `${"*".repeat(phone.length - 4)}${phone.slice(-4)}`;
  };

  const loadQr = async (amt?: string, nts?: string) => {
    try {
      setMessage("");
      const q = new URLSearchParams();
      if (amt) q.set("amount", amt);
      if (nts) q.set("notes", nts);

      const res = await apiGet<{ data: string }>(
        `/api/receive-qr?${q.toString()}`,
      );
      const dataUrl = await QRCode.toDataURL(res.data || "", {
        width: 200,
        margin: 1,
        color: {
          dark: "#02AA9E",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      setQrDataUrl("");
      setMessage(
        err instanceof Error ? err.message : "Failed to generate QR code",
      );
    }
  };

  useEffect(() => {
    void loadQr().catch(() => undefined);
  }, []);

  const saveImage = async () => {
    const section = downloadQrRef.current;
    if (!section) return;

    try {
      const html2canvas = (
        window as unknown as {
          html2canvas?: (
            element: HTMLElement,
            opts?: {
              scale?: number;
              backgroundColor?: string | null;
              ignoreElements?: (element: Element) => boolean;
            },
          ) => Promise<HTMLCanvasElement>;
        }
      ).html2canvas;

      if (!html2canvas) {
        setMessage("Save image is not ready yet. Please try again.");
        return;
      }

      const canvas = await html2canvas(section, {
        scale: 2,
        backgroundColor: null,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${Date.now()}.png`;
      link.click();
    } catch {
      setMessage("Failed to save image");
    }
  };

  return (
    <>
      <Script
        src="/frontend/js/html2canvas.min.js"
        strategy="afterInteractive"
      />
      <MobileShell
        title="Scan and Pay"
        backHref="/"
        notifications={profile?.unReadNotifications || 0}
      >
        <div className="receive-qr" ref={qrSectionRef}>
          <div className="row">
            <div className="col-12">
              <div className="card mini-stat bg-theme text-white">
                <div className="card-body">
                  <p className="text-white-50 mb-3 mt-1">
                    {profile?.name} ({maskedPhone(profile?.phone)})
                  </p>
                  <p className="text-center download-text">Scan to pay me</p>
                  {amount ? (
                    <h3 className="text-center mb-3 mt-1">
                      {Number(amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <small>MMK</small>
                    </h3>
                  ) : null}
                  {notes ? <p className="text-center">{notes}</p> : null}
                  <div className="text-center">
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR" /> : null}
                  </div>
                  {message ? (
                    <p className="text-warning text-center mt-2 mb-0">
                      {message}
                    </p>
                  ) : null}
                  <div className="d-flex mt-3 manual justify-content-between">
                    {!amount ? (
                      <button
                        className="btn btn-link"
                        style={{ color: "#02AA9E" }}
                        onClick={() => setShowSetAmountModal(true)}
                      >
                        Set Amount
                      </button>
                    ) : (
                      <button
                        className="btn btn-link"
                        style={{ color: "#02AA9E" }}
                        onClick={() => {
                          setAmount("");
                          setNotes("");
                          void loadQr().catch(() => undefined);
                        }}
                      >
                        Clear Amount
                      </button>
                    )}
                    {qrDataUrl ? (
                      <button
                        type="button"
                        className="btn btn-link"
                        style={{ color: "#02AA9E" }}
                        onClick={() => {
                          void saveImage();
                        }}
                      >
                        Save Image
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="bg-white card-footer d-flex justify-content-center">
                  <img src="/images/logo-sm.png" width="60" alt="Logo" />
                  <h3>{appName}</h3>
                </div>
              </div>
            </div>
          </div>

          {showSetAmountModal ? (
            <>
              <div
                className="modal fade show d-block"
                role="dialog"
                aria-modal="true"
              >
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content bg-theme text-white">
                    <div className="modal-header">
                      <h5 className="modal-title">Set Amount</h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={() => {
                          setShowSetAmountModal(false);
                          setAmount("");
                          setNotes("");
                        }}
                      />
                    </div>
                    <div className="modal-body text-center">
                      <div className="mb-4 mt-3">
                        <label className="form-label" htmlFor="amount">
                          Enter your confirm amount:
                        </label>
                        <br />
                        <input
                          id="amount"
                          className="form-control"
                          type="number"
                          min={1000}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <div className="mb-4 mt-3">
                        <label className="form-label" htmlFor="notes">
                          Enter your notes:
                        </label>
                        <br />
                        <input
                          id="notes"
                          className="form-control"
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setShowSetAmountModal(false);
                          setAmount("");
                          setNotes("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-theme"
                        disabled={!amount || Number(amount) < 1000}
                        onClick={() => {
                          void loadQr(amount, notes).catch(() => undefined);
                          setShowSetAmountModal(false);
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show" />
            </>
          ) : null}
        </div>

        <div
          ref={downloadQrRef}
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            width: 720,
            background: "#333547",
            color: "#fff",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "32px 24px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
              Scan to pay me
            </p>
            <div style={{ marginTop: 24 }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" width="260" height="260" />
              ) : null}
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <img src="/images/logo-sm.png" width="56" alt="Logo" />
            <h3 style={{ margin: 0, color: "#02AA9E", fontSize: 44 / 2 }}>
              {appName}
            </h3>
          </div>
        </div>
      </MobileShell>
    </>
  );
}
