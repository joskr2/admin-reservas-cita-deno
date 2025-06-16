/**
 * Utilidades de criptografía compatibles con Deno Deploy
 * Reemplaza bcrypt usando Web Crypto API
 */

const encoder = new TextEncoder();

/**
 * Genera un salt aleatorio
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Deriva una clave usando PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return new Uint8Array(derivedBits);
}

/**
 * Convierte bytes a string hexadecimal
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convierte string hexadecimal a bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hashea una contraseña
 * @param password - La contraseña a hashear
 * @returns El hash de la contraseña en formato "salt:hash"
 */
export async function hash(password: string): Promise<string> {
  const salt = generateSalt();
  const hashedPassword = await deriveKey(password, salt);

  return `${bytesToHex(salt)}:${bytesToHex(hashedPassword)}`;
}

/**
 * Compara una contraseña con su hash
 * @param password - La contraseña en texto plano
 * @param hashedPassword - El hash almacenado
 * @returns true si la contraseña coincide
 */
export async function compare(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const parts = hashedPassword.split(":");
    if (parts.length !== 2) {
      return false;
    }
    const saltHex = parts[0]!;
    const hashHex = parts[1]!;

    const salt = hexToBytes(saltHex);
    const storedHash = hexToBytes(hashHex);
    const derivedHash = await deriveKey(password, salt);

    // Comparación de tiempo constante
    if (storedHash.length !== derivedHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < storedHash.length; i++) {
      result |= storedHash[i]! ^ derivedHash[i]!;
    }

    
    return result === 0;
  } catch {
    return false;
  }
}
