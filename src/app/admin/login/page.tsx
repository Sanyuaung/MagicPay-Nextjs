"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiPost } from "@/lib/browser-api";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            await apiPost("/api/admin/login", { email, password });
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
                            <div className="bg-theme text-center p-4">
                                <h5 className="text-white font-size-20">
                                    Admin Login
                                </h5>
                            </div>
                            <div className="card-body p-4 bg-theme">
                                <form onSubmit={submit}>
                                    <div className="mb-3">
                                        <label className="text-white form-label">
                                            Email
                                        </label>
                                        <input
                                            className="form-control"
                                            type="email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-white form-label">
                                            Password
                                        </label>
                                        <input
                                            className="form-control"
                                            type="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    {message ? (
                                        <p className="text-warning">
                                            {message}
                                        </p>
                                    ) : null}
                                    <button
                                        className="btn btn-theme"
                                        type="submit"
                                    >
                                        Login
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
