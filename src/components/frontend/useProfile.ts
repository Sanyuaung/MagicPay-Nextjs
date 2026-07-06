"use client";

import { useCallback, useEffect, useState } from "react";

import { apiGet } from "@/lib/browser-api";

export type ProfileData = {
    name: string;
    email: string;
    phone: string;
    profile: string;
    wallet_balance: string;
    wallet_account: string;
    unReadNotifications: number;
    has_pin: number;
};

export function useProfile() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const reload = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await apiGet<{ data: ProfileData }>("/api/profile");
            setProfile(res.data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load profile",
            );
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    return { profile, loading, error, reload };
}
