import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { Role } from '@/types'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'church-speakers-default-secret-change-me'
)

export const COOKIE_NAME = 'auth-token'

export interface AuthPayload {
  userId: number
  email: string
  name: string
  role: Role
}

export async function createToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as AuthPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<AuthPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export function canEdit(role: Role): boolean {
  return role === 'bishop' || role === 'counselor'
}
