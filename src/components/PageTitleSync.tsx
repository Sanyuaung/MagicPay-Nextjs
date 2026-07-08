"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Magic Pay";

function cleanTitle(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z0-9]+/, "")
    .trim();
}

function fallbackTitleFromPath(pathname: string): string {
  if (!pathname || pathname === "/") return "Home";

  const last = pathname.split("/").filter(Boolean).pop();

  if (!last) return "";

  const decoded = decodeURIComponent(last)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return decoded;
}

function getCurrentPageTitle(pathname: string): string {
  if (pathname === "/") {
    return "Home";
  }

  const candidates = [
    ".page-title-box .page-title",
    ".logo-admin h3",
    "h5.text-white.font-size-20",
    "main h1",
    "main h2",
    "main h3",
  ];

  for (const selector of candidates) {
    const text = cleanTitle(document.querySelector(selector)?.textContent);
    if (text) return text;
  }

  return fallbackTitleFromPath(pathname);
}

export function PageTitleSync() {
  const pathname = usePathname();

  useEffect(() => {
    const setTitle = () => {
      const pageTitle = getCurrentPageTitle(pathname);
      document.title = pageTitle ? `${APP_NAME} || ${pageTitle}` : APP_NAME;
    };

    setTitle();
    const timer = window.setTimeout(setTitle, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
