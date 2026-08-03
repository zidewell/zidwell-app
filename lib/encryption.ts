import crypto from "crypto";

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable must be set");
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

const deriveKey = (salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(
    ENCRYPTION_KEY,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    "sha256"
  );
};

export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", deriveKey(salt), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return salt.toString("hex") + ":" + iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

export function decrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const textParts = text.split(":");
    
    if (textParts.length >= 3) {
      const salt = Buffer.from(textParts.shift() || "", "hex");
      const iv = Buffer.from(textParts.shift() || "", "hex");
      if (iv.length !== IV_LENGTH || salt.length !== SALT_LENGTH) {
        throw new Error("Invalid salt or IV length");
      }
      const encryptedText = textParts.join(":");
      const decipher = crypto.createDecipheriv("aes-256-cbc", deriveKey(salt), iv);
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    if (textParts.length < 2) {
      throw new Error("Invalid encrypted text format");
    }
    const iv = Buffer.from(textParts.shift() || "", "hex");
    if (iv.length !== IV_LENGTH) {
      throw new Error("Invalid IV length");
    }
    const encryptedText = textParts.join(":");
    const legacySalt = Buffer.from("zidwell-encryption-salt", "utf8");
    const decipher = crypto.createDecipheriv("aes-256-cbc", deriveKey(legacySalt), iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

export function hashBvn(bvn: string | null | undefined): string | null {
  if (!bvn) return null;
  return crypto.createHash("sha256").update(bvn).digest("hex");
}

export function maskBvn(bvn: string | null | undefined): string {
  if (!bvn) return "";
  if (bvn.length <= 4) return "****";
  return "****" + bvn.slice(-4);
}
