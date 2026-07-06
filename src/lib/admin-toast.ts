export type AdminToastType = "success" | "error";

export function withAdminToast(
    path: string,
    message: string,
    type: AdminToastType = "success",
): string {
    const [basePath, queryString = ""] = path.split("?");
    const params = new URLSearchParams(queryString);
    params.set("toast", message);
    params.set("toastType", type);

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
}
