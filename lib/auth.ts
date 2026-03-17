import { Role } from '@/types'

export interface AuthPayload {
  userId: number
  email: string
  name: string
  role: Role
}

// No authentication — everyone gets full access
export async function getSession(): Promise<AuthPayload> {
  return { userId: 1, email: '', name: 'Admin', role: 'bishop' }
}

export function canEdit(_role: Role): boolean {
  return true
}
