"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PhoneTextInput } from "@/components/PhoneTextInput";
import { apiPost } from "@/lib/browser-api";
import { setToken } from "@/lib/browser-auth";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "App";
  const year = new Date().getFullYear();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await apiPost<{
        data: { token: string };
        message: string;
      }>("/api/login", {
        phone,
        password,
        remember,
      });
      if (res.data?.token) {
        setToken(res.data.token, remember);
      }
      router.push("/");
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
                  <h5 className="text-white font-size-20">Welcome Back !</h5>
                  <p className="text-white-50">
                    Sign in to continue to {appName}.
                  </p>
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
                      <label className="text-white form-label" htmlFor="phone">
                        Phone Number
                      </label>
                      <PhoneTextInput
                        id="phone"
                        className="form-control"
                        placeholder="Enter your phone number"
                        value={phone}
                        onValueChange={setPhone}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label
                        className="text-white form-label"
                        htmlFor="userpassword"
                      >
                        Password
                      </label>
                      <div className="pin password-wrapper login-password-wrapper">
                        <input
                          id="userpassword"
                          type={showPassword ? "text" : "password"}
                          className="form-control"
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
                            id="customControlInline"
                            type="checkbox"
                            className="form-check-input"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                          />
                          <label
                            className="text-white form-check-label"
                            htmlFor="customControlInline"
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

                    <div className="mt-2 mb-0 row">
                      <div className="col-12 mt-4">
                        <Link
                          href="/password/reset"
                          className="forgot-password-link"
                        >
                          <i className="mdi mdi-lock" /> Forgot your password?
                        </Link>
                      </div>
                    </div>
                  </form>

                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-info"
                      onClick={() => {
                        setPhone("09788677455");
                        setPassword("password");
                      }}
                    >
                      <i className="mdi mdi-account-key me-1" />
                      Use sample user login
                    </button>
                    <div className="mt-2">
                      <Link
                        href="/admin/login"
                        className="btn btn-link p-0 text-success fw-medium"
                      >
                        <i className="mdi mdi-shield-account me-1" />
                        Go to admin login
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p>
                Don&apos;t have an account ?{" "}
                <Link href="/register" className="fw-medium text-success">
                  Signup now
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
  );
}
