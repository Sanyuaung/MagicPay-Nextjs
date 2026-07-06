"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { apiPost } from "@/lib/browser-api";

export default function Page() {
    const router = useRouter();
    const { profile } = useProfile();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            const res = await apiPost<{ message: string }>(
                "/api/update-password",
                {
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword,
                },
            );
            setMessage(res.message);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            router.push("/profile");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Update failed");
        }
    };

    return (
        <MobileShell
            title="Update Password"
            backHref="/profile"
            notifications={profile?.unReadNotifications || 0}
        >
            <div className="account-pages">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6 col-xl-6">
                        <div className="card overflow-hidden bg-theme text-white">
                            <div className="card-body p-4">
                                <form onSubmit={submit}>
                                    <div className="mb-4 password-wrapper">
                                        <div className="col-11">
                                            <label className="form-label">
                                                Current Password
                                            </label>
                                            <input
                                                className="form-control"
                                                type={
                                                    showCurrentPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Enter your current password"
                                                value={currentPassword}
                                                onChange={(e) =>
                                                    setCurrentPassword(
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-1 pin">
                                            <i
                                                className={`toggle-password mdi ${
                                                    showCurrentPassword
                                                        ? "mdi-eye"
                                                        : "mdi-eye-off"
                                                }`}
                                                onClick={() =>
                                                    setShowCurrentPassword(
                                                        (prev) => !prev,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4 password-wrapper">
                                        <div className="col-11">
                                            <label className="form-label">
                                                New Password
                                            </label>
                                            <input
                                                className="form-control"
                                                type={
                                                    showNewPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Enter your new password"
                                                value={newPassword}
                                                onChange={(e) =>
                                                    setNewPassword(
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-1 pin">
                                            <i
                                                className={`toggle-password mdi ${
                                                    showNewPassword
                                                        ? "mdi-eye"
                                                        : "mdi-eye-off"
                                                }`}
                                                onClick={() =>
                                                    setShowNewPassword(
                                                        (prev) => !prev,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4 password-wrapper">
                                        <div className="col-11">
                                            <label className="form-label">
                                                Confirm New Password
                                            </label>
                                            <input
                                                className="form-control"
                                                type={
                                                    showConfirmPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Confirm your new password"
                                                value={confirmPassword}
                                                onChange={(e) =>
                                                    setConfirmPassword(
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-1 pin">
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
                                        <p className="text-warning mb-3">
                                            {message}
                                        </p>
                                    ) : null}
                                    <button
                                        className="btn btn-theme w-md waves-effect waves-light"
                                        type="submit"
                                    >
                                        Update Password
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
