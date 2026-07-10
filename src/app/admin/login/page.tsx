"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiPost } from "@/lib/browser-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Magic Pay";
  const year = new Date().getFullYear();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      await apiPost("/api/admin/login", { email, password, remember });
      router.push("/admin");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="account-pages my-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-4">
            <div className="card overflow-hidden">
              <div className="bg-theme">
                <div className="text-primary text-center p-4">
                  <h5 className="text-white font-size-20">Admin Login</h5>
                  <p className="text-white-50">Sign in to manage {appName}.</p>
                  <Link href="/" className="logo logo-admin">
                    <img
                      src="/backend/assets/images/logo-sm.png"
                      height="24"
                      alt="logo"
                    />
                  </Link>
                </div>
              </div>

              <div className="card-body p-4 bg-theme">
                <div className="p-3">
                  <form className="mt-4" onSubmit={submit}>
                    <div className="mb-3">
                      <label className="text-white form-label" htmlFor="email">
                        Email
                      </label>
                      <input
                        id="email"
                        className="form-control"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label
                        className="text-white form-label"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <div className="pin password-wrapper login-password-wrapper">
                        <input
                          id="password"
                          className="form-control"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <i
                          className={`toggle-password mdi ${
                            showPassword ? "mdi-eye" : "mdi-eye-off"
                          }`}
                          onClick={() => setShowPassword((prev) => !prev)}
                        />
                      </div>
                    </div>
                    {message ? <p className="text-warning">{message}</p> : null}
                    <div className="mb-3 row">
                      <div className="col-sm-6">
                        <div className="form-check">
                          <input
                            id="adminRemember"
                            type="checkbox"
                            className="form-check-input"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                          />
                          <label
                            className="text-white form-check-label"
                            htmlFor="adminRemember"
                          >
                            Remember me
                          </label>
                        </div>
                      </div>
                      <div className="col-sm-6 text-end">
                        <button
                          className="btn btn-theme w-md waves-effect waves-light"
                          type="submit"
                        >
                          Log In
                        </button>
                      </div>
                    </div>
                    {remember ? (
                      <div className="mb-3">
                        <small className="d-block text-white-50">
                          Keep me signed in on this device for up to 30 days.
                        </small>
                      </div>
                    ) : null}
                  </form>

                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-info"
                      onClick={() => {
                        setEmail("admin@gmail.com");
                        setPassword("password");
                      }}
                    >
                      <i className="mdi mdi-shield-account me-1" />
                      Use admin sample
                    </button>
                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-info"
                        onClick={() => {
                          setEmail("admin@magicpay.local");
                          setPassword("Admin123");
                        }}
                      >
                        <i className="mdi mdi-crown me-1" />
                        Use super admin sample
                      </button>
                    </div>
                    <div className="mt-2">
                      <Link
                        href="/login"
                        className="btn btn-link p-0 text-success fw-medium"
                      >
                        <i className="mdi mdi-account-arrow-left me-1" />
                        Back to user login
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="mb-0 text-muted">
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
  );
}
