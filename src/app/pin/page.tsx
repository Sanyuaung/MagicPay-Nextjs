"use client";

import { useState } from "react";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { apiPost } from "@/lib/browser-api";

export default function Page() {
    const { profile } = useProfile();
    const hasPin = profile?.has_pin === 1;
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [message, setMessage] = useState("");
    const [showCurrentPin, setShowCurrentPin] = useState(false);
    const [showNewPin, setShowNewPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            if (hasPin) {
                const res = await apiPost<{ message: string }>(
                    "/api/update-pin",
                    {
                        current_pin: currentPin,
                        new_pin_code: newPin,
                        new_pin_code_confirmation: confirmPin,
                    },
                );
                setMessage(res.message);
            } else {
                const res = await apiPost<{ message: string }>("/api/pin", {
                    pin_code: newPin,
                    pin_code_confirmation: confirmPin,
                });
                setMessage(res.message);
            }
            setCurrentPin("");
            setNewPin("");
            setConfirmPin("");
        } catch (err) {
            setMessage(
                err instanceof Error ? err.message : "PIN update failed",
            );
        }
    };

    return (
        <MobileShell
            title="Set PIN"
            backHref="/profile"
            notifications={profile?.unReadNotifications || 0}
        >
            <div className="account-pages">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6 col-xl-6">
                        <div className="card overflow-hidden bg-theme text-white">
                            <div className="card-body p-4">
                                <form onSubmit={submit}>
                                    {hasPin ? (
                                        <div className="mb-4 password-wrapper">
                                            <div className="col-11">
                                                <label className="form-label">
                                                    Current PIN
                                                </label>
                                                <input
                                                    className="form-control"
                                                    type={
                                                        showCurrentPin
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    maxLength={6}
                                                    placeholder="Enter your current PIN"
                                                    value={currentPin}
                                                    onChange={(e) =>
                                                        setCurrentPin(
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div className="col-1 pin">
                                                <i
                                                    className={`toggle-password mdi ${
                                                        showCurrentPin
                                                            ? "mdi-eye"
                                                            : "mdi-eye-off"
                                                    }`}
                                                    onClick={() =>
                                                        setShowCurrentPin(
                                                            (prev) => !prev,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ) : null}
                                    <div className="mb-4 password-wrapper">
                                        <div className="col-11">
                                            <label className="form-label">
                                                New PIN
                                            </label>
                                            <input
                                                className="form-control"
                                                type={
                                                    showNewPin
                                                        ? "text"
                                                        : "password"
                                                }
                                                maxLength={6}
                                                placeholder="Enter your new PIN"
                                                value={newPin}
                                                onChange={(e) =>
                                                    setNewPin(e.target.value)
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-1 pin">
                                            <i
                                                className={`toggle-password mdi ${
                                                    showNewPin
                                                        ? "mdi-eye"
                                                        : "mdi-eye-off"
                                                }`}
                                                onClick={() =>
                                                    setShowNewPin(
                                                        (prev) => !prev,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4 password-wrapper">
                                        <div className="col-11">
                                            <label className="form-label">
                                                Confirm New PIN
                                            </label>
                                            <input
                                                className="form-control"
                                                type={
                                                    showConfirmPin
                                                        ? "text"
                                                        : "password"
                                                }
                                                maxLength={6}
                                                placeholder="Confirm your new PIN"
                                                value={confirmPin}
                                                onChange={(e) =>
                                                    setConfirmPin(
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-1 pin">
                                            <i
                                                className={`toggle-password mdi ${
                                                    showConfirmPin
                                                        ? "mdi-eye"
                                                        : "mdi-eye-off"
                                                }`}
                                                onClick={() =>
                                                    setShowConfirmPin(
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
                                        {hasPin ? "Update PIN" : "Save"}
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
