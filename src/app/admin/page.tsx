"use client";

import { AdminShell } from "@/components/frontend/AdminShell";

export default function AdminHomePage() {
    return (
        <AdminShell
            title="Dashboard"
            titleIconClass="ti-home"
            breadcrumb="Welcome to Magic Pay Dashboard"
            breadcrumbSingle
        >
            <div className="col-12" />
        </AdminShell>
    );
}
