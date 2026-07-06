"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/frontend/AdminShell";
import { withAdminToast } from "@/lib/admin-toast";
import { apiGet, apiPut } from "@/lib/browser-api";

type AdminProfile = {
    id: string;
    name: string;
    email: string;
    phone: string;
};

export default function AdminProfilePage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const run = async () => {
            const res = await apiGet<{ data: AdminProfile }>(
                "/api/admin/profile",
            );
            setName(res.data.name);
            setEmail(res.data.email);
            setPhone(res.data.phone);
        };
        void run().catch(() => undefined);
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        try {
            await apiPut("/api/admin/profile", {
                name,
                email,
                phone,
                password,
            });
            setPassword("");
            router.push(
                withAdminToast(
                    "/admin/profile",
                    "Profile updated successfully.",
                ),
            );
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Update failed");
        }
    };

    return (
        <AdminShell
            title="Profile"
            breadcrumb="Profile"
            titleIconClass="mdi mdi-account-circle"
        >
            <div className="col-lg-12">
                <div className="card">
                    <div className="card-body">
                        <form
                            className="row g-3 needs-validation"
                            onSubmit={submit}
                        >
                            <div className="col-md-6">
                                <label className="form-label">Name</label>
                                <input
                                    className="form-control"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Email</label>
                                <input
                                    className="form-control"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Phone</label>
                                <input
                                    className="form-control"
                                    type="number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">
                                    Password (leave blank to keep current)
                                </label>
                                <input
                                    className="form-control"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </div>
                            {message ? (
                                <div className="col-12 text-danger">
                                    {message}
                                </div>
                            ) : null}
                            <div className="col-12">
                                <button className="btn btn-theme" type="submit">
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
