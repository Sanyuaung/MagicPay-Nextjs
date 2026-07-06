"use client";

import { clearToken, getToken } from "@/lib/browser-auth";

export type ApiResult<T> = {
  result: number;
  type: "success" | "error";
  message: string;
  data?: T;
  error?: unknown;
};

type RequestEventDetail = {
  method: string;
  isWrite: boolean;
};

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const isWrite = method !== "GET";

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<RequestEventDetail>("magicpay:request-start", {
        detail: { method, isWrite },
      }),
    );
  }

  try {
    const token = getToken();
    const headers = new Headers(init.headers);
    const isFormDataBody =
      typeof FormData !== "undefined" && init.body instanceof FormData;
    if (!isFormDataBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(url, {
      ...init,
      headers,
    });

    let json: unknown = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      json = await res.json();
    } else {
      const text = await res.text();
      json = text ? { message: text } : {};
    }

    if (res.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        const isAdminRequest =
          url.includes("/api/admin/") ||
          window.location.pathname.startsWith("/admin");
        window.location.href = isAdminRequest ? "/admin/login" : "/login";
      }
    }

    if (!res.ok) {
      const message =
        typeof json === "object" &&
        json &&
        "message" in json &&
        typeof (json as { message?: unknown }).message === "string"
          ? (json as { message: string }).message
          : `Request failed (${res.status})`;
      throw new Error(message);
    }

    return json as T;
  } finally {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<RequestEventDetail>("magicpay:request-end", {
          detail: { method, isWrite },
        }),
      );
    }
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  return request<T>(url, { method: "GET" });
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const isFormDataBody =
    typeof FormData !== "undefined" && body instanceof FormData;
  return request<T>(url, {
    method: "POST",
    body: isFormDataBody ? (body as FormData) : JSON.stringify(body),
  });
}

export async function apiDelete<T>(url: string): Promise<T> {
  return request<T>(url, { method: "DELETE" });
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const isFormDataBody =
    typeof FormData !== "undefined" && body instanceof FormData;
  return request<T>(url, {
    method: "PUT",
    body: isFormDataBody ? (body as FormData) : JSON.stringify(body),
  });
}
