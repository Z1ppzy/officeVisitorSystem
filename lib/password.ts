import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ALGORITHM = "pbkdf2_sha256";
const ITERATIONS = 120_000;
const KEY_LENGTH = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256").toString(
    "base64url"
  );
  return `${ALGORITHM}$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, iterationsRaw, salt, hash] = storedHash.split("$");
  const iterations = Number(iterationsRaw);

  if (algorithm !== ALGORITHM || !Number.isFinite(iterations) || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, "sha256");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
