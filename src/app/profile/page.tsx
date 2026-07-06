"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { MobileShell } from "@/components/frontend/MobileShell";
import { useProfile } from "@/components/frontend/useProfile";
import { apiPost } from "@/lib/browser-api";
import { clearToken, getToken } from "@/lib/browser-auth";

export default function Page() {
  const router = useRouter();
  const { profile } = useProfile();

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  const onLogout = async () => {
    try {
      await apiPost("/api/logout", {});
    } catch {
      // noop
    }
    clearToken();
    router.push("/login");
  };

  return (
    <MobileShell
      title="Profile"
      backHref="/"
      notifications={profile?.unReadNotifications || 0}
    >
      <div className="account-pages">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-6">
            <div className="user-sidebar">
              <div className="card bg-theme text-white">
                <div className="card-body">
                  <div className="mt-n4 position-relative">
                    <div className="text-center">
                      <img
                        src={`https://ui-avatars.com/api/?background=02AA9E&color=fff&name=${encodeURIComponent(profile?.name || "User")}`}
                        alt="Profile"
                        className="avatar-lg rounded-circle img-thumbnail"
                      />
                      <div className="mt-3">
                        <h5>{profile?.name}</h5>
                        <h5>{profile?.phone}</h5>
                        <h5>{profile?.email}</h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="card mb-3 bg-theme text-white">
                  <div className="card-body pr-0">
                    <Link
                      href="/update-password"
                      className="d-flex justify-content-between align-content-center"
                    >
                      <span>Change Password</span>
                      <span className="mr-2">
                        <i className="fa fa-angle-right" />
                      </span>
                    </Link>
                    <hr />
                    <Link
                      href="/pin"
                      className="d-flex justify-content-between align-content-center"
                    >
                      <span>
                        {profile?.wallet_account ? "Change PIN" : "Set PIN"}
                      </span>
                      <span className="mr-2">
                        <i className="fa fa-angle-right" />
                      </span>
                    </Link>
                    <hr />
                    <button
                      type="button"
                      onClick={onLogout}
                      className="d-flex justify-content-between align-content-center dropdown-item profile-logout-btn"
                    >
                      Logout{" "}
                      <span className="mr-2">
                        <i className="mdi mdi-logout" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
