"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";

type QrResult = { data?: string } | string;

type QrScannerInstance = {
  start: () => Promise<void> | void;
  stop: () => void;
  destroy?: () => void;
};

type QrScannerOptions = {
  returnDetailedScanResult?: boolean;
  preferredCamera?: "environment" | "user";
  onDecodeError?: (error: unknown) => void;
};

type QrScannerCtor = new (
  video: HTMLVideoElement,
  onDecode: (result: QrResult) => void,
  options?: QrScannerOptions,
) => QrScannerInstance;

declare global {
  interface Window {
    QrScanner?: QrScannerCtor;
  }
}

export default function Page() {
  const router = useRouter();
  const { profile } = useProfile();
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanError, setScanError] = useState("");
  const [isScriptReady, setIsScriptReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScannerInstance | null>(null);

  useEffect(() => {
    if (!showScanModal) {
      scannerRef.current?.stop();
      scannerRef.current?.destroy?.();
      scannerRef.current = null;
      return;
    }

    if (!isScriptReady || !videoRef.current || !window.QrScanner) {
      return;
    }

    setScanError("");

    const scanner = new window.QrScanner(
      videoRef.current,
      (result) => {
        const qrContent =
          typeof result === "string" ? result : (result.data ?? "");

        if (!qrContent) {
          return;
        }

        scanner.stop();
        scanner.destroy?.();
        scannerRef.current = null;
        setShowScanModal(false);
        router.push(
          `/scan-and-pay-form?qrContent=${encodeURIComponent(qrContent)}`,
        );
      },
      {
        returnDetailedScanResult: true,
        preferredCamera: "environment",
        onDecodeError: () => {
          // Ignore frame-by-frame decode misses while camera is active.
        },
      },
    );

    scannerRef.current = scanner;

    Promise.resolve(scanner.start()).catch(() => {
      setScanError(
        "Unable to access camera. Please allow camera permission and try again.",
      );
    });

    return () => {
      scanner.stop();
      scanner.destroy?.();
      scannerRef.current = null;
    };
  }, [isScriptReady, router, showScanModal]);

  return (
    <>
      <Script
        src="/frontend/js/qr-scanner.legacy.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptReady(true)}
      />
      <MobileShell
        title="Scan and Pay"
        backHref="/"
        notifications={profile?.unReadNotifications || 0}
      >
        <div className="scan-and-pay">
          <div className="row">
            <div className="col-12">
              <div className="card mini-stat bg-theme text-white">
                <div className="card-body text-center">
                  <div>
                    <img
                      src="/frontend/images/Scan&Pay.png"
                      alt="Scan&Pay"
                      className="img-fluid"
                      width="200"
                    />
                  </div>
                  <p className="mb-3">
                    Click button, put QR code in the frame and pay.
                  </p>
                  <button
                    type="button"
                    className="btn btn-theme waves-effect waves-light"
                    onClick={() => setShowScanModal(true)}
                  >
                    Scan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MobileShell>

      {showScanModal ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            zIndex: 2000,
          }}
        >
          <div
            className="card bg-theme text-white w-100 mx-3"
            style={{ maxWidth: 420 }}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Scan Pay</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Close"
                onClick={() => setShowScanModal(false)}
              />
            </div>
            <div className="card-body">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ width: "100%", borderRadius: 8 }}
              />
              {scanError ? (
                <p className="text-warning mt-3 mb-0">{scanError}</p>
              ) : null}
            </div>
            <div className="card-footer text-end">
              <button
                type="button"
                className="btn btn-sm btn-theme"
                onClick={() => setShowScanModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
