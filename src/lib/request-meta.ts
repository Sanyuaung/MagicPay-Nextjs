export function getRequestMeta(req: Request): {
    ip: string | null;
    userAgent: string | null;
} {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip =
        (
            forwardedFor?.split(",")[0] ||
            req.headers.get("x-real-ip") ||
            ""
        ).trim() || null;
    const userAgent = (req.headers.get("user-agent") || "").trim() || null;

    return { ip, userAgent };
}
