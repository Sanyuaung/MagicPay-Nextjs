"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiPost } from "@/lib/browser-api";
import { setToken } from "@/lib/browser-auth";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState("");
    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Laravel";
    const year = new Date().getFullYear();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            if (password !== confirmPassword) {
                setMessage("Password confirmation does not match");
                return;
            }
            const res = await apiPost<{ data: { token: string } }>(
                "/api/register",
                {
                    name,
                    email,
                    phone,
                    password,
                },
            );
            if (res.data?.token) {
                setToken(res.data.token);
            }
            router.push("/");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Register failed");
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
                                        <h5 className="text-white font-size-20">
                                            Free Register
                                        </h5>
                                        <p className="text-white-50">
                                            Get your free {appName} account now.
                                        </p>
                                        <Link
                                            href="/"
                                            className="logo logo-admin"
                                        >
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
                                        <form
                                            className="mt-4"
                                            onSubmit={submit}
                                        >
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
                                                    placeholder="Enter your email"
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
                                                    htmlFor="username"
                                                >
                                                    Username
                                                </label>
                                                <input
                                                    id="username"
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter your username"
                                                    value={name}
                                                    onChange={(e) =>
                                                        setName(e.target.value)
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label
                                                    className="text-white form-label"
                                                    htmlFor="phone"
                                                >
                                                    Phone Number
                                                </label>
                                                <input
                                                    id="phone"
                                                    type="number"
                                                    className="form-control"
                                                    placeholder="Enter your phone number"
                                                    value={phone}
                                                    onChange={(e) =>
                                                        setPhone(e.target.value)
                                                    }
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
                                                <div className="pin password-wrapper auth-password-wrapper">
                                                    <input
                                                        id="userpassword"
                                                        type={
                                                            showPassword
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        className="form-control"
                                                        placeholder="Enter your password"
                                                        value={password}
                                                        onChange={(e) =>
                                                            setPassword(
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                    <i
                                                        className={`toggle-password mdi ${
                                                            showPassword
                                                                ? "mdi-eye"
                                                                : "mdi-eye-off"
                                                        }`}
                                                        onClick={() =>
                                                            setShowPassword(
                                                                (prev) => !prev,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label
                                                    className="text-white form-label"
                                                    htmlFor="userpasswordconfirm"
                                                >
                                                    Confirm Password
                                                </label>
                                                <div className="pin password-wrapper auth-password-wrapper">
                                                    <input
                                                        id="userpasswordconfirm"
                                                        type={
                                                            showConfirmPassword
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        className="form-control"
                                                        placeholder="Enter your confirm password"
                                                        value={confirmPassword}
                                                        onChange={(e) =>
                                                            setConfirmPassword(
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                    <i
                                                        className={`toggle-password mdi ${
                                                            showConfirmPassword
                                                                ? "mdi-eye"
                                                                : "mdi-eye-off"
                                                        }`}
                                                        onClick={() =>
                                                            setShowConfirmPassword(
                                                                (prev) => !prev,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            {message ? (
                                                <p className="text-warning">
                                                    {message}
                                                </p>
                                            ) : null}
                                            <div className="mb-3 row">
                                                <div className="col-12 text-end">
                                                    <button
                                                        className="btn btn-theme w-md waves-effect waves-light"
                                                        type="submit"
                                                    >
                                                        Register
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <p>
                                    Already have an account ?{" "}
                                    <Link
                                        href="/login"
                                        className="fw-medium text-success"
                                    >
                                        Login
                                    </Link>
                                </p>
                                <p className="mb-0">
                                    &copy;{year} {appName}
                                    <span>
                                        {" "}
                                        - with{" "}
                                        <i className="mdi mdi-heart text-danger" />{" "}
                                        by SanYuAung.
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
