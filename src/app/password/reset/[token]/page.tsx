"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiPost } from "@/lib/browser-api";

export default function PasswordResetTokenPage() {
    const params = useParams<{ token: string }>();
    const token = typeof params?.token === "string" ? params.token : "";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        setEmail(query.get("email") || "");
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const res = await apiPost<{ message: string }>(
                "/api/password/reset",
                {
                    email,
                    token,
                    password,
                    password_confirmation: passwordConfirmation,
                },
            );
            setMessage(res.message || "Password reset successfully!");
            setPassword("");
            setPasswordConfirmation("");
        } catch (err) {
            setMessage(
                err instanceof Error ? err.message : "Password reset failed",
            );
        } finally {
            setLoading(false);
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
                                    <h5 className="text-white font-size-20 p-2">
                                        Set New Password
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
                                    <form className="mt-4" onSubmit={submit}>
                                        <div className="mb-3">
                                            <label
                                                className="text-white form-label"
                                                htmlFor="resetEmail"
                                            >
                                                Email
                                            </label>
                                            <input
                                                id="resetEmail"
                                                type="email"
                                                className="form-control"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label
                                                className="text-white form-label"
                                                htmlFor="newPassword"
                                            >
                                                New Password
                                            </label>
                                            <input
                                                id="newPassword"
                                                type="password"
                                                className="form-control"
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                minLength={8}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label
                                                className="text-white form-label"
                                                htmlFor="confirmPassword"
                                            >
                                                Confirm Password
                                            </label>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                className="form-control"
                                                value={passwordConfirmation}
                                                onChange={(e) =>
                                                    setPasswordConfirmation(
                                                        e.target.value,
                                                    )
                                                }
                                                minLength={8}
                                                required
                                            />
                                        </div>

                                        {message ? (
                                            <p className="text-white-50">
                                                {message}
                                            </p>
                                        ) : null}

                                        <div className="row mb-0">
                                            <div className="col-12 text-end">
                                                <button
                                                    className="btn btn-theme w-md waves-effect waves-light"
                                                    type="submit"
                                                    disabled={loading || !token}
                                                >
                                                    {loading
                                                        ? "Saving..."
                                                        : "Reset Password"}
                                                </button>
                                            </div>
                                        </div>
                                    </form>

                                    <p className="mt-3 mb-0 text-white-50">
                                        <Link
                                            href="/login"
                                            className="text-warning"
                                        >
                                            Back to Sign In
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
