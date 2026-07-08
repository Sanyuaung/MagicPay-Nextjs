"use client";

import Link from "next/link";
import { useState } from "react";

import { apiPost } from "@/lib/browser-api";

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null,
  );
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Laravel";
  const year = new Date().getFullYear();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType(null);
    setResetUrl(null);
    setLoading(true);
    try {
      const res = await apiPost<{
        data?: { sent: boolean; reset_url?: string | null };
        message: string;
      }>("/api/password/email", { email });
      setMessage(
        res.message ||
          "If your email exists, reset instructions have been sent.",
      );
      setMessageType("success");
      setResetUrl(res.data?.reset_url || null);
      setEmail("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reset request failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="home-btn d-none d-sm-block">
        <Link href="/" className="text-dark">
          <i className="fas fa-home h2" />
        </Link>
      </div>

      <div className="account-pages my-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6 col-xl-4">
              <div className="card overflow-hidden">
                <div className="bg-theme">
                  <div className="text-primary text-center p-4">
                    <h5 className="text-white font-size-20 p-2">
                      Reset Password
                    </h5>
                    <Link href="/" className="logo logo-admin">
                      <img
                        src="/backend/assets/images/logo-sm.png"
                        height="24"
                        alt="logo"
                      />
                    </Link>
                  </div>
                </div>

                <div className="card-body bg-theme p-4">
                  <div className="p-3">
                    <div className="alert alert-success mt-5" role="alert">
                      Enter your Email and instructions will be sent to you!
                    </div>

                    <form className="mt-4" onSubmit={submit}>
                      <div className="mb-3">
                        <label
                          className="text-white form-label"
                          htmlFor="useremail"
                        >
                          Email
                        </label>
                        <input
                          id="useremail"
                          type="email"
                          className="form-control"
                          placeholder="Enter email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      {message ? (
                        <p
                          className={
                            messageType === "success"
                              ? "text-success"
                              : "text-warning"
                          }
                        >
                          {message}
                        </p>
                      ) : null}
                      {resetUrl ? (
                        <p className="text-white-50 small mt-2">
                          Dev reset link:{" "}
                          <Link href={resetUrl} className="text-warning">
                            Open reset form
                          </Link>
                        </p>
                      ) : null}

                      <div className="row mb-0">
                        <div className="col-12 text-end">
                          <button
                            className="btn btn-theme w-md waves-effect waves-light"
                            type="submit"
                            disabled={loading}
                          >
                            {loading ? "Sending..." : "Reset"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p>
                  Remember It ?{" "}
                  <Link href="/login" className="fw-medium text-success">
                    Sign In here
                  </Link>
                </p>
                <p className="mb-0">
                  &copy;{year} {appName}
                  <span>
                    {" "}
                    - with <i className="mdi mdi-heart text-danger" /> by
                    SanYuAung.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
