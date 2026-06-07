import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const masterKeyHex = process.env.MASTER_KEY;

if (!masterKeyHex) {
  throw new Error(
    "[Crypto] Missing MASTER_KEY env var. Generate one with `node createMasterKey.js` and add it to .env"
  );
}

if (!/^[0-9a-fA-F]{64}$/.test(masterKeyHex)) {
  throw new Error(
    "[Crypto] Invalid MASTER_KEY. Expected a 64-character hex string (32 bytes for aes-256-gcm)."
  );
}

const MASTER_KEY = Buffer.from(masterKeyHex, "hex");

export function encrypt(text){
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(
    ALGORITHM,
    MASTER_KEY,
    iv
    );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted : encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decrypt(data) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    MASTER_KEY,
    Buffer.from(data.iv, "hex")
  );

  decipher.setAuthTag(
    Buffer.from(data.authTag, "hex")
  );

  let decrypted = decipher.update(
    data.encrypted,
    "hex",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
}