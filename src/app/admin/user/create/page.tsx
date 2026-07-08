"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminShell } from "@/components/frontend/AdminShell";
import { PhoneTextInput } from "@/components/PhoneTextInput";
import { apiPost } from "@/lib/browser-api";
import { withAdminToast } from "@/lib/admin-toast";

export default function UserCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      await apiPost("/api/admin/users", { name, email, phone, password });
      router.push(withAdminToast("/admin/user", "User created successfully."));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
    }
  };

  return (
    <AdminShell
      title="Create User"
      breadcrumb="Users"
      cancelHref="/admin/user"
      titleIconClass="ion ion-md-people"
    >
      <div className="col-lg-12">
        <div className="card">
          <div className="card-body">
            <form className="row g-3 needs-validation" onSubmit={submit}>
              <div className="col-md-6">
                <label className="form-label">User Name</label>
                <input
                  className="form-control"
                  placeholder="Enter user name"
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
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <PhoneTextInput
                  className="form-control"
                  placeholder="Enter phone number"
                  value={phone}
                  onValueChange={setPhone}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {message ? (
                <div className="col-12 text-danger">{message}</div>
              ) : null}
              <div className="col-12">
                <button className="btn btn-theme" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
