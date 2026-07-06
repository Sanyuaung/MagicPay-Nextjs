"use client";

import { useEffect, useState } from "react";

export function GlobalRequestLoader() {
  const [barActive, setBarActive] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);

  useEffect(() => {
    if (overlayActive) {
      document.body.classList.add("is-request-loading");
    } else {
      document.body.classList.remove("is-request-loading");
    }

    return () => {
      document.body.classList.remove("is-request-loading");
    };
  }, [overlayActive]);

  useEffect(() => {
    let pendingAll = 0;

    const onStart = (_event: Event) => {
      pendingAll += 1;
      setBarActive(pendingAll > 0);
      setOverlayActive(pendingAll > 0);
    };

    const onEnd = (_event: Event) => {
      pendingAll = Math.max(0, pendingAll - 1);
      setBarActive(pendingAll > 0);
      setOverlayActive(pendingAll > 0);
    };

    window.addEventListener("magicpay:request-start", onStart);
    window.addEventListener("magicpay:request-end", onEnd);

    return () => {
      window.removeEventListener("magicpay:request-start", onStart);
      window.removeEventListener("magicpay:request-end", onEnd);
    };
  }, []);

  return (
    <>
      <div
        className={`global-activity-bar ${barActive ? "is-active" : ""}`}
        aria-hidden="true"
      />
      {overlayActive ? (
        <div className="global-action-loading" role="status" aria-live="polite">
          <div className="global-action-loading-card">
            <span className="global-action-spinner" aria-hidden="true" />
            <span>Processing...</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
