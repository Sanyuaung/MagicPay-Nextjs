import crypto from "node:crypto";
import Hashids from "hashids";

export function id2hash(value: string): string {
    const hashids = new Hashids(
        process.env.HASHIDS_SALT || "",
        Number(process.env.HASHIDS_LENGTH || 8),
    );
    const bytes = [...Buffer.from(value, "utf-8")];
    return hashids.encode(bytes);
}

export function hash2id(hash: string): string {
    const hashids = new Hashids(
        process.env.HASHIDS_SALT || "",
        Number(process.env.HASHIDS_LENGTH || 8),
    );
    const decoded = hashids.decode(hash).map((v) => Number(v));
    if (!decoded.length) {
        return "";
    }
    return Buffer.from(decoded).toString("utf-8");
}

function getCipherKey(): Buffer {
    const rawKey =
        process.env.APP_KEY || process.env.SECRET_KEY || "magicpay-default";

    // Mirror Laravel passphrase behavior while guaranteeing a valid AES-128 key length.
    const keySource = Buffer.from(
        rawKey.replace(/^['\"]|['\"]$/g, ""),
        "utf-8",
    );
    if (keySource.length >= 16) {
        return keySource.subarray(0, 16);
    }

    const paddedKey = Buffer.alloc(16);
    keySource.copy(paddedKey);
    return paddedKey;
}

export function encryptQR(content: string): string {
    const cipher = crypto.createCipheriv("aes-128-ecb", getCipherKey(), null);
    cipher.setAutoPadding(true);
    const encrypted = Buffer.concat([
        cipher.update(content, "utf-8"),
        cipher.final(),
    ]);
    return encrypted.toString("base64");
}

export function decryptQR(encryptedContent: string): string {
    const decipher = crypto.createDecipheriv(
        "aes-128-ecb",
        getCipherKey(),
        null,
    );
    decipher.setAutoPadding(true);
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedContent, "base64")),
        decipher.final(),
    ]);
    return decrypted.toString("utf-8");
}
