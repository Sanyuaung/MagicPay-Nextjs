export function formatUserAgentSummary(userAgent: string | null): string {
    if (!userAgent || !userAgent.trim()) {
        return "N/A";
    }

    const ua = userAgent.toLowerCase();

    let platform = "Unknown";
    if (ua.includes("windows")) platform = "Windows";
    else if (ua.includes("mac os") || ua.includes("macintosh"))
        platform = "macOS";
    else if (ua.includes("android")) platform = "Android";
    else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios"))
        platform = "iOS";
    else if (ua.includes("linux")) platform = "Linux";

    let device = "Desktop";
    if (ua.includes("ipad") || ua.includes("tablet")) device = "Tablet";
    else if (
        ua.includes("mobile") ||
        ua.includes("iphone") ||
        ua.includes("android")
    ) {
        device = "Mobile";
    }

    let browser = "Unknown";
    if (ua.includes("edg/")) browser = "Edge";
    else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
    else if (ua.includes("chrome/") && !ua.includes("edg/")) browser = "Chrome";
    else if (ua.includes("safari/") && !ua.includes("chrome/"))
        browser = "Safari";
    else if (ua.includes("firefox/")) browser = "Firefox";

    return `${platform} / ${device} / ${browser}`;
}
