import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const PROMOTION_IMAGE_DIR = path.join(
    process.cwd(),
    "public",
    "images",
    "promotion",
);

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
]);

export function getPromotionImageUrl(filename?: string | null): string | null {
    if (!filename) return null;
    return `/images/promotion/${filename}`;
}

export async function removePromotionImage(
    filename?: string | null,
): Promise<void> {
    if (!filename) return;

    const filePath = path.join(PROMOTION_IMAGE_DIR, filename);
    try {
        await unlink(filePath);
    } catch {
        // ignore missing/locked file cleanup failures to match Laravel leniency
    }
}

export async function savePromotionImage(file: File): Promise<string> {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
        throw new Error("Image must be a jpg, jpeg, or png file.");
    }

    const maxSizeInBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        throw new Error("Image must not be greater than 2MB.");
    }

    await mkdir(PROMOTION_IMAGE_DIR, { recursive: true });

    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}_${safeOriginalName}`;
    const filePath = path.join(PROMOTION_IMAGE_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return filename;
}
