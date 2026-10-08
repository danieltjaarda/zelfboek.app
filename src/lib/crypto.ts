import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from "crypto";

/** Sleutel uit APP_SECRET; zonder secret draait het op een vaste ontwikkelsleutel. */
function sleutel() {
  const geheim = process.env.APP_SECRET || "ontwikkel-sleutel-niet-voor-productie";
  return scryptSync(geheim, "boekhoudbot", 32);
}

export function versleutel(tekst: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sleutel(), iv);
  const data = Buffer.concat([cipher.update(tekst, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), data.toString("base64")].join(".");
}

export function ontsleutel(blob: string): string {
  const [iv, tag, data] = blob.split(".").map((x) => Buffer.from(x, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", sleutel(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export const willekeurigToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const zesCijfers = () => String(Math.floor(100000 + Math.random() * 900000));
