"use client";

import { AdminShell } from "@/components/frontend/AdminShell";

const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "App";

export default function AdminHomePage() {
  return (
    <AdminShell
      title="Dashboard"
      titleIconClass="ti-home"
      breadcrumb={`Welcome to ${appName} Dashboard`}
      breadcrumbSingle
    >
      <div className="col-12" />
    </AdminShell>
  );
}
