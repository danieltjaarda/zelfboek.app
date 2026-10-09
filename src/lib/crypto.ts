import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";

/** APP_SECRET; alleen buiten productie valt het terug op een vaste ontwikkelsleutel. */
export function appGeheim(): string {
  const geheim = process.env.APP_SECRET;
  if (geheim) return geheim;
  if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET ontbreekt: zet een lange willekeurige string in de omgeving.");
  return "ontwikkel-sleutel-niet-voor-productie";
}

/** Sleutel uit APP_SECRET. */
function sleutel() {
  return scryptSync(appGeheim(), "boekhoudbot", 32);
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
export const zesCijfers = () => String(100000 + randomInt(900000));

/** Vergelijk een meegegeven geheim met het verwachte, zonder timing-lek. */
export function geheimKlopt(gegeven: string | null | undefined, verwacht: string | null | undefined): boolean {
  if (!gegeven || !verwacht) return false;
  const a = Buffer.from(gegeven);
  const b = Buffer.from(verwacht);
  return a.length === b.length && timingSafeEqual(a, b);
}
