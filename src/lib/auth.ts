import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);
const JWT_EXPIRES_IN = '24h';

export interface AuthJWTPayload extends JWTPayload {
  id: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isIdVerified: boolean;
}

/**
 * Generate an Edge-compatible JWT using Jose
 */
export async function generateToken(payload: AuthJWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(encodedSecret);
}

/**
 * Verify an Edge-compatible JWT
 */
export async function verifyToken(token: string): Promise<AuthJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as AuthJWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Hash a text password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password against hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a 6 digit secure numeric OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
