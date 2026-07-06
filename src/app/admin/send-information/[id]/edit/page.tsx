"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiGet, apiPut } from "@/lib/browser-api";
import { withAdminToast } from "@/lib/admin-toast";

type Info = {
    id: string;
    type: string;
    status: number;
    title: string;
    message: string;
    image?: string | null;
    image_url?: string | null;
    web_link?: string | null;
};

export default function SendInfoEditPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [type, setType] = useState("Announcement");
    const [typeSearch, setTypeSearch] = useState("");
    const [showTypeMenu, setShowTypeMenu] = useState(false);
    const [status, setStatus] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [image, setImage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [webLink, setWebLink] = useState("");
    const [error, setError] = useState("");
    const typeMenuRef = useRef<HTMLDivElement | null>(null);

    const typeOptions = useMemo(
        () => [
            { value: "Promotion", label: "Promotion Notification" },
            { value: "Announcement", label: "System Notification" },
        ],
        [],
    );

    const filteredTypeOptions = typeOptions.filter((option) =>
        option.label.toLowerCase().includes(typeSearch.trim().toLowerCase()),
    );

    useEffect(() => {
        let disposed = false;

        const ensureEditor = async () => {
            if (typeof window === "undefined") return;

            let existing = document.querySelector(
                'script[data-magicpay-tinymce="1"]',
            ) as HTMLScriptElement | null;
            if (!existing) {
                existing = document.createElement("script");
                existing.src = "/backend/assets/libs/tinymce/tinymce.min.js";
                existing.async = true;
                existing.dataset.magicpayTinymce = "1";
                document.body.appendChild(existing);
            }

            await new Promise<void>((resolve, reject) => {
                const loaded = (window as Window & { tinymce?: unknown })
                    .tinymce;
                if (loaded) {
                    resolve();
                    return;
                }

                const done = () => resolve();
                const fail = () => reject(new Error("TinyMCE load failed"));
                existing!.addEventListener("load", done, { once: true });
                existing!.addEventListener("error", fail, { once: true });
            });

            if (disposed) return;

            const tiny = (window as Window & { tinymce?: any }).tinymce;
            if (!tiny) return;

            if (tiny.get("elm1")) {
                tiny.get("elm1").remove();
            }

            tiny.init({
                selector: "#elm1",
                menubar: "file edit view insert format tools table",
                height: 300,
                plugins:
                    "advlist autolink link image lists charmap print preview hr anchor pagebreak spellchecker searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking save table contextmenu directionality emoticons template paste textcolor",
                toolbar:
                    "insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | print preview media fullpage | forecolor backcolor emoticons",
                setup(editor: any) {
                    editor.on("Change KeyUp SetContent", () => {
                        setMessage(editor.getContent());
                    });
                },
            });
        };

        void ensureEditor().catch(() => undefined);

        return () => {
            disposed = true;
            if (typeof window !== "undefined") {
                const tiny = (window as Window & { tinymce?: any }).tinymce;
                if (tiny?.get("elm1")) {
                    tiny.get("elm1").remove();
                }
            }
        };
    }, []);

    useEffect(() => {
        const switchInput = document.getElementById("switch3");
        if (switchInput) {
            switchInput.setAttribute("switch", "bool");
        }
    }, []);

    useEffect(() => {
        const onOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!typeMenuRef.current?.contains(target)) {
                setShowTypeMenu(false);
            }
        };

        document.addEventListener("mousedown", onOutsideClick);
        return () => {
            document.removeEventListener("mousedown", onOutsideClick);
        };
    }, []);

    useEffect(() => {
        const run = async () => {
            const res = await apiGet<{ data: Info }>(
                `/api/admin/send-information/${id}`,
            );
            const d = res.data;
            setType(d.type);
            const matchedType = typeOptions.find(
                (option) => option.value === d.type,
            );
            setTypeSearch(matchedType?.label || d.type || "");
            setStatus(d.status === 1);
            setTitle(d.title);
            setMessage(d.message);
            setImage(d.image || "");
            setImageUrl(d.image_url || "");
            setWebLink(d.web_link || "");

            const tiny = (window as Window & { tinymce?: any }).tinymce;
            if (tiny?.get("elm1")) {
                tiny.get("elm1").setContent(d.message || "");
            }
        };
        void run().catch(() => undefined);
    }, [id, typeOptions]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const payload = new FormData();
            payload.append("type", type);
            payload.append("status", status ? "1" : "0");
            payload.append("title", title);
            payload.append("message", message);
            payload.append("web_link", type === "Promotion" ? webLink : "");
            if (type === "Promotion" && imageFile) {
                payload.append("image", imageFile);
            }

            await apiPut(`/api/admin/send-information/${id}`, payload);
            router.push(
                withAdminToast(
                    "/admin/send-information",
                    "Send information updated successfully.",
                ),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Update failed");
        }
    };

    return (
        <AdminShell
            title="Edit Send Informations"
            breadcrumb="Send Informations"
            breadcrumbCurrent="Edit"
            cancelHref="/admin/send-information"
        >
            <div className="col-lg-12">
                <div className="card">
                    <div className="card-body">
                        <form
                            className="row g-3 needs-validation"
                            onSubmit={submit}
                        >
                            <div className="col-md-3 position-relative">
                                <label className="form-label">Type</label>
                                <div
                                    className="wallet-user-search"
                                    ref={typeMenuRef}
                                >
                                    <input
                                        className="form-control"
                                        placeholder="Select"
                                        value={typeSearch}
                                        onFocus={() => setShowTypeMenu(true)}
                                        onChange={(e) => {
                                            setTypeSearch(e.target.value);
                                            setType("");
                                            setShowTypeMenu(true);
                                        }}
                                        required
                                    />
                                    {showTypeMenu ? (
                                        <div className="wallet-user-search-menu">
                                            {filteredTypeOptions.length ? (
                                                filteredTypeOptions.map(
                                                    (option) => (
                                                        <button
                                                            type="button"
                                                            key={option.value}
                                                            className={`wallet-user-search-item ${
                                                                type ===
                                                                option.value
                                                                    ? "is-selected"
                                                                    : ""
                                                            }`}
                                                            onClick={() => {
                                                                setType(
                                                                    option.value,
                                                                );
                                                                setTypeSearch(
                                                                    option.label,
                                                                );
                                                                setShowTypeMenu(
                                                                    false,
                                                                );
                                                            }}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ),
                                                )
                                            ) : (
                                                <div className="wallet-user-search-empty">
                                                    No types found
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="col-md-3 position-relative">
                                <label className="form-label">Status</label>
                                <div>
                                    <input
                                        name="status"
                                        className="form-check form-switch"
                                        type="checkbox"
                                        id="switch3"
                                        role="switch"
                                        checked={status}
                                        onChange={(e) =>
                                            setStatus(e.target.checked)
                                        }
                                        disabled={status}
                                    />
                                    <label
                                        className="form-label"
                                        htmlFor="switch3"
                                        data-on-label="ON"
                                        data-off-label="OFF"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6 position-relative">
                                <label className="form-label">Title</label>
                                <input
                                    className="form-control"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            {type === "Promotion" ? (
                                <>
                                    <div
                                        className="col-md-6 position-relative"
                                        id="imageField"
                                    >
                                        <label className="form-label">
                                            Image
                                        </label>
                                        {image ? (
                                            <div className="mb-2 text-muted small">
                                                Current: {image}
                                            </div>
                                        ) : null}
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt="Current"
                                                width={100}
                                                className="img-thumbnail mb-2 d-block"
                                            />
                                        ) : null}
                                        <input
                                            className="form-control"
                                            type="file"
                                            accept="image/jpeg,image/png,image/jpg"
                                            onChange={(e) => {
                                                setImageFile(
                                                    e.target.files?.[0] || null,
                                                );
                                            }}
                                        />
                                        {imageFile ? (
                                            <div className="mt-2 text-muted small">
                                                Selected: {imageFile.name}
                                            </div>
                                        ) : null}
                                    </div>
                                    <div
                                        className="col-md-6 position-relative"
                                        id="webLinkField"
                                    >
                                        <label className="form-label">
                                            Web Link
                                        </label>
                                        <input
                                            className="form-control"
                                            value={webLink}
                                            onChange={(e) =>
                                                setWebLink(e.target.value)
                                            }
                                        />
                                    </div>
                                </>
                            ) : null}
                            <div className="col-md-12 position-relative">
                                <label className="form-label">Message</label>
                                <textarea
                                    id="elm1"
                                    className="form-control"
                                    rows={5}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                />
                            </div>
                            {error ? (
                                <div className="col-12 text-danger">
                                    {error}
                                </div>
                            ) : null}
                            <div className="col-12">
                                <button
                                    className="btn btn-info"
                                    type="submit"
                                    title="Save"
                                >
                                    <i className="fas fa-save" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
